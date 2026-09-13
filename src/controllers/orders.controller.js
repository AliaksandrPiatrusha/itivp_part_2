const orders = require('../models/orders.model');
const cart = require('../models/cart.model');
const ApiError = require('../utils/ApiError');
const { parseId, requireFields } = require('../utils/validators');

const list = async (req, res) => {
  res.json({ data: await orders.findAll(req.query) });
};

const getOne = async (req, res) => {
  const id = parseId(req.params.id);
  const order = await orders.findById(id);
  if (!order) throw ApiError.notFound(`Заказ с id=${id} не найден`);
  res.json({ data: order });
};

const checkout = async (req, res) => {
  requireFields(req.body, ['customer']);
  requireFields(req.body.customer, ['name', 'email', 'address']);

  const items = await cart.getItems();
  if (items.length === 0) throw ApiError.badRequest('Корзина пуста, заказ не может быть создан');

  const order = await orders.checkout({ customer: req.body.customer, items });

  res.status(201).location(`/api/orders/${order.id}`).json({ data: order });
};

const replace = async (req, res) => {
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

  const updated = await orders.replace(id, { customer: req.body.customer, items, status });
  if (!updated) throw ApiError.notFound(`Заказ с id=${id} не найден`);
  res.json({ data: updated });
};

const changeStatus = async (req, res) => {
  const id = parseId(req.params.id);
  requireFields(req.body, ['status']);
  if (!orders.STATUSES.includes(req.body.status)) {
    throw ApiError.badRequest(`Недопустимый статус: ${req.body.status}`, orders.STATUSES);
  }
  const updated = await orders.updateStatus(id, req.body.status);
  if (!updated) throw ApiError.notFound(`Заказ с id=${id} не найден`);
  res.json({ data: updated });
};

const remove = async (req, res) => {
  const id = parseId(req.params.id);
  const deleted = await orders.remove(id);
  if (!deleted) throw ApiError.notFound(`Заказ с id=${id} не найден`);
  res.status(204).end();
};

module.exports = { list, getOne, checkout, replace, changeStatus, remove };
