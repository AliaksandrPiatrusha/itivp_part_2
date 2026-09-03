const orders = require('../models/orders.model');
const cart = require('../models/cart.model');
const products = require('../models/products.model');
const ApiError = require('../utils/ApiError');
const { parseId, requireFields } = require('../utils/validators');

const list = (req, res) => {
  res.json({ data: orders.findAll(req.query) });
};

const getOne = (req, res) => {
  const id = parseId(req.params.id);
  const order = orders.findById(id);
  if (!order) throw ApiError.notFound(`Заказ с id=${id} не найден`);
  res.json({ data: order });
};

const checkout = (req, res) => {
  requireFields(req.body, ['customer']);
  requireFields(req.body.customer, ['name', 'email', 'address']);

  const items = cart.getItems();
  if (items.length === 0) throw ApiError.badRequest('Корзина пуста, заказ не может быть создан');

  const order = orders.create({
    customer: req.body.customer,
    items: items.map(i => ({ ...i }))
  });

  items.forEach(i => products.decreaseStock(i.productId, i.quantity));
  cart.clear();

  res.status(201).location(`/api/orders/${order.id}`).json({ data: order });
};

const replace = (req, res) => {
  const id = parseId(req.params.id);
  requireFields(req.body, ['customer', 'items', 'status']);
  requireFields(req.body.customer, ['name', 'email', 'address']);

  const { items, status } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('Поле items должно быть непустым массивом');
  }
  if (!orders.STATUSES.includes(status)) {
    throw ApiError.badRequest(`Недопустимый статус: ${status}`, orders.STATUSES);
  }

  const updated = orders.replace(id, { customer: req.body.customer, items, status });
  if (!updated) throw ApiError.notFound(`Заказ с id=${id} не найден`);
  res.json({ data: updated });
};

const changeStatus = (req, res) => {
  const id = parseId(req.params.id);
  requireFields(req.body, ['status']);
  if (!orders.STATUSES.includes(req.body.status)) {
    throw ApiError.badRequest(`Недопустимый статус: ${req.body.status}`, orders.STATUSES);
  }
  const updated = orders.updateStatus(id, req.body.status);
  if (!updated) throw ApiError.notFound(`Заказ с id=${id} не найден`);
  res.json({ data: updated });
};

const remove = (req, res) => {
  const id = parseId(req.params.id);
  const deleted = orders.remove(id);
  if (!deleted) throw ApiError.notFound(`Заказ с id=${id} не найден`);
  res.status(204).end();
};

module.exports = { list, getOne, checkout, replace, changeStatus, remove };