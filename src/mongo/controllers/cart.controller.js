const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../../utils/ApiError');
const { requireFields, requirePositiveInt, parseObjectId } = require('../../utils/validators');

const stockError = (inCart, stock) => (stock <= 0
  ? ApiError.conflict('Товара нет на складе', { stock, inCart })
  : ApiError.conflict(`В корзине уже ${inCart} из ${stock} доступных`, { stock, inCart }));

const emptyCart = userId => ({ userId, items: [], total: 0 });

const loadCart = userId =>
  Cart.findOne({ userId }).populate('items.product', 'title category color sizes stock price');

const incrementOrPush = async (userId, product, size, quantity, retried = false) => {
  const sameItem = { $elemMatch: { product: product._id, size } };

  const incremented = await Cart.findOneAndUpdate(
    { userId, items: sameItem },
    { $inc: { 'items.$.quantity': quantity } },
    { new: true }
  );
  if (incremented) return incremented;

  try {
    return await Cart.findOneAndUpdate(
      { userId, items: { $not: sameItem } },
      { $push: { items: { product: product._id, title: product.title, size, price: product.price, quantity } } },
      { new: true, upsert: true, runValidators: true }
    );
  } catch (err) {
    if (err.code === 11000 && !retried) return incrementOrPush(userId, product, size, quantity, true);
    throw err;
  }
};

const view = async (req, res) => {
  const cart = await loadCart(req.user.id);
  res.json({ data: cart || emptyCart(req.user.id) });
};

const addItem = async (req, res) => {
  requireFields(req.body, ['productId', 'size']);
  const productId = parseObjectId(req.body.productId);
  const size = String(req.body.size);
  const quantity = req.body.quantity === undefined ? 1 : req.body.quantity;
  requirePositiveInt(quantity, 'quantity');

  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound(`Товар с id=${productId} не найден`);
  if (!product.hasSize(size)) {
    throw ApiError.badRequest(`Размер ${size} недоступен для этого товара`, product.sizes);
  }

  const cart = await Cart.findOne({ userId: req.user.id });
  const inCart = cart ? cart.quantityOf(productId) : 0;
  if (inCart + quantity > product.stock) throw stockError(inCart, product.stock);

  const updated = await incrementOrPush(req.user.id, product, size, quantity);
  res.status(201).json({ data: updated });
};

const updateItem = async (req, res) => {
  const itemId = parseObjectId(req.params.itemId);
  requireFields(req.body, ['quantity']);
  const { quantity } = req.body;
  requirePositiveInt(quantity, 'quantity');

  const cart = await Cart.findOne({ userId: req.user.id, 'items._id': itemId });
  if (!cart) throw ApiError.notFound(`Позиция корзины с id=${itemId} не найдена`);
  const item = cart.items.id(itemId);

  if (quantity > item.quantity) {
    const product = await Product.findById(item.product);
    const stock = product ? product.stock : 0;
    const others = cart.quantityOf(item.product, itemId);
    if (others + quantity > stock) throw stockError(others + item.quantity, stock);
  }

  const updated = await Cart.findOneAndUpdate(
    { userId: req.user.id, 'items._id': itemId },
    { $set: { 'items.$.quantity': quantity } },
    { new: true, runValidators: true }
  );
  if (!updated) throw ApiError.notFound(`Позиция корзины с id=${itemId} не найдена`);
  res.json({ data: updated });
};

const removeItem = async (req, res) => {
  const itemId = parseObjectId(req.params.itemId);
  const updated = await Cart.findOneAndUpdate(
    { userId: req.user.id, 'items._id': itemId },
    { $pull: { items: { _id: itemId } } },
    { new: true }
  );
  if (!updated) throw ApiError.notFound(`Позиция корзины с id=${itemId} не найдена`);
  res.json({ data: updated });
};

const clear = async (req, res) => {
  await Cart.updateOne({ userId: req.user.id }, { $set: { items: [] } });
  res.status(204).end();
};

module.exports = { view, addItem, updateItem, removeItem, clear };
