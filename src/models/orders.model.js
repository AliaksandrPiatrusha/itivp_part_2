const { Op } = require('sequelize');
const { sequelize, Order, OrderItem, Product, CartItem } = require('../db/models');
const ApiError = require('../utils/ApiError');

const STATUSES = Order.STATUSES;

const itemsInclude = { model: OrderItem, as: 'items' };

const calcTotal = items =>
  Number(items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0).toFixed(2));

const escapeLike = value => String(value).replace(/[%_\\]/g, '\\$&');

const toDTO = order => {
  if (!order) return null;
  const plain = order.get({ plain: true });
  return {
    id: plain.id,
    customer: {
      name: plain.customerName,
      email: plain.customerEmail,
      phone: plain.customerPhone,
      address: plain.customerAddress
    },
    items: (plain.items || []).map(i => ({
      id: i.id,
      productId: i.productId,
      title: i.title,
      size: i.size,
      price: Number(i.price),
      quantity: i.quantity
    })),
    total: Number(plain.total),
    status: plain.status,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt
  };
};

const findAll = async ({ status, customer } = {}) => {
  if (status && !STATUSES.includes(status)) return [];

  const where = {};
  if (status) where.status = status;
  if (customer) where.customerName = { [Op.iLike]: `%${escapeLike(customer)}%` };

  const orders = await Order.findAll({ where, include: itemsInclude, order: [['id', 'ASC']] });
  return orders.map(toDTO);
};

const findById = async id => {
  const order = await Order.findByPk(id, { include: itemsInclude });
  return toDTO(order);
};

const checkout = ({ customer, items }) =>
  sequelize.transaction(async transaction => {
    for (const item of items) {
      const product = await Product.findByPk(item.productId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!product || item.quantity > product.stock) {
        throw ApiError.conflict(`Недостаточно товара на складе: ${item.title}`, { productId: item.productId });
      }
    }

    const order = await Order.create({
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      status: 'new',
      total: calcTotal(items)
    }, { transaction });

    await OrderItem.bulkCreate(
      items.map(i => ({
        orderId: order.id,
        productId: i.productId,
        title: i.title,
        size: i.size,
        price: i.price,
        quantity: i.quantity
      })),
      { transaction }
    );

    await Promise.all(items.map(i =>
      Product.decrement('stock', { by: i.quantity, where: { id: i.productId }, transaction })
    ));
    await CartItem.destroy({ where: {}, transaction });

    await order.reload({ include: itemsInclude, transaction });
    return toDTO(order);
  });

const replace = (id, { customer, items, status }) =>
  sequelize.transaction(async transaction => {
    const order = await Order.findByPk(id, { transaction });
    if (!order) return null;

    await order.update({
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      status,
      total: calcTotal(items)
    }, { transaction });

    await OrderItem.destroy({ where: { orderId: id }, transaction });
    await OrderItem.bulkCreate(
      items.map(i => ({
        orderId: id,
        productId: i.productId,
        title: i.title,
        size: i.size,
        price: i.price,
        quantity: i.quantity
      })),
      { transaction }
    );

    await order.reload({ include: itemsInclude, transaction });
    return toDTO(order);
  });

const updateStatus = async (id, status) => {
  const order = await Order.findByPk(id, { include: itemsInclude });
  if (!order) return null;
  await order.update({ status });
  return toDTO(order);
};

const remove = async id => {
  const order = await Order.findByPk(id);
  if (!order) return null;
  await order.destroy();
  return order;
};

module.exports = { STATUSES, findAll, findById, checkout, replace, updateStatus, remove };
