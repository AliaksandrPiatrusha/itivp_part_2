const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../../utils/ApiError');
const {
  requireFields, requirePositiveInt, parseObjectId, queryString, escapeRegex
} = require('../../utils/validators');

const STATUSES = Order.STATUSES;

const isAdmin = req => req.user.role === 'admin';

const pickCustomer = source => ['name', 'email', 'phone', 'address'].reduce((acc, f) => {
  if (typeof source[f] === 'string') acc[f] = source[f];
  return acc;
}, {});

const requireStatus = status => {
  if (!STATUSES.includes(status)) throw ApiError.badRequest(`Недопустимый статус: ${status}`, STATUSES);
};

const list = async (req, res) => {
  const status = queryString(req.query.status);
  const customer = queryString(req.query.customer);
  if (status && !STATUSES.includes(status)) return res.json({ data: [] });

  const query = Order.find();
  if (!isAdmin(req)) query.where('userId').equals(req.user.id);
  if (status) query.where('status').equals(status);
  if (customer) query.where('customer.name').regex(new RegExp(escapeRegex(customer), 'i'));

  res.json({ data: await query.sort({ createdAt: -1 }) });
};

const stats = async (req, res) => {
  const [byStatus, topProducts] = await Promise.all([
    Order.aggregate([
      { $group: { _id: '$status', orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } }
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          title: { $first: '$items.title' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 }
    ])
  ]);
  res.json({ data: { byStatus, topProducts } });
};

const getOne = async (req, res) => {
  const id = parseObjectId(req.params.id);
  const order = await Order.findById(id).populate('items.product', 'title category stock');
  if (!order || (!isAdmin(req) && order.userId !== req.user.id)) {
    throw ApiError.notFound(`Заказ с id=${id} не найден`);
  }
  res.json({ data: order });
};

const reserveStock = async items => {
  const reserved = [];
  try {
    for (const item of items) {
      const { modifiedCount } = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
      if (modifiedCount === 0) {
        throw ApiError.conflict(`Недостаточно товара на складе: ${item.title}`, { productId: item.product });
      }
      reserved.push(item);
    }
  } catch (err) {
    await releaseStock(reserved);
    throw err;
  }
};

const releaseStock = items => Promise.all(items.map(i =>
  Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })
));

const checkout = async (req, res) => {
  requireFields(req.body, ['customer']);
  const customer = { email: req.user.email, ...pickCustomer(req.body.customer) };
  requireFields(customer, ['name', 'email', 'address']);

  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart || cart.items.length === 0) throw ApiError.badRequest('Корзина пуста, заказ не может быть создан');

  const items = cart.items.map(i => ({
    product: i.product, title: i.title, size: i.size, price: i.price, quantity: i.quantity
  }));

  await reserveStock(items);
  let order;
  try {
    order = await Order.create({ userId: req.user.id, customer, items });
  } catch (err) {
    await releaseStock(items);
    throw err;
  }
  await Cart.updateOne({ userId: req.user.id }, { $set: { items: [] } });

  res.status(201).location(`/api/mongo/orders/${order.id}`).json({ data: order });
};

const parseItems = items => {
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('Поле items должно быть непустым массивом');
  }
  return items.map(i => {
    requireFields(i, ['productId', 'title', 'size', 'price', 'quantity']);
    requirePositiveInt(i.quantity, 'quantity');
    const price = Number(i.price);
    if (!Number.isFinite(price) || price < 0) throw ApiError.badRequest('Поле price должно быть неотрицательным числом');
    return {
      product: parseObjectId(i.productId), title: String(i.title), size: String(i.size), price, quantity: i.quantity
    };
  });
};

const replace = async (req, res) => {
  const id = parseObjectId(req.params.id);
  requireFields(req.body, ['customer', 'items', 'status']);
  const customer = pickCustomer(req.body.customer);
  requireFields(customer, ['name', 'email', 'address']);
  requireStatus(req.body.status);
  const items = parseItems(req.body.items);

  const updated = await Order.findByIdAndUpdate(
    id,
    { customer, items, status: req.body.status, total: Order.calcTotal(items) },
    { new: true, runValidators: true }
  );
  if (!updated) throw ApiError.notFound(`Заказ с id=${id} не найден`);
  res.json({ data: updated });
};

const changeStatus = async (req, res) => {
  const id = parseObjectId(req.params.id);
  requireFields(req.body, ['status']);
  requireStatus(req.body.status);

  const updated = await Order.findByIdAndUpdate(
    id,
    { $set: { status: req.body.status }, $push: { statusHistory: { status: req.body.status } } },
    { new: true, runValidators: true }
  );
  if (!updated) throw ApiError.notFound(`Заказ с id=${id} не найден`);
  res.json({ data: updated });
};

const remove = async (req, res) => {
  const id = parseObjectId(req.params.id);
  const deleted = await Order.findByIdAndDelete(id);
  if (!deleted) throw ApiError.notFound(`Заказ с id=${id} не найден`);
  res.json({ data: deleted });
};

module.exports = { list, stats, getOne, checkout, replace, changeStatus, remove };
