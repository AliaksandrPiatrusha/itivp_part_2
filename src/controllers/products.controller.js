const products = require('../models/products.model');
const ApiError = require('../utils/ApiError');
const { parseId, requireFields } = require('../utils/validators');

const validateBody = body => {
  requireFields(body, ['title', 'category', 'sizes', 'price']);
  if (!Array.isArray(body.sizes) || body.sizes.length === 0) {
    throw ApiError.badRequest('Поле sizes должно быть непустым массивом');
  }
  if (typeof body.price !== 'number' || body.price <= 0) {
    throw ApiError.badRequest('Поле price должно быть положительным числом');
  }
  return {
    title: body.title,
    category: body.category,
    sizes: body.sizes,
    color: body.color || '',
    price: body.price,
    stock: Number.isInteger(body.stock) ? body.stock : 0
  };
};

const list = (req, res) => {
  res.json({ data: products.findAll(req.query) });
};

const getOne = (req, res) => {
  const id = parseId(req.params.id);
  const product = products.findById(id);
  if (!product) throw ApiError.notFound(`Товар с id=${id} не найден`);
  res.json({ data: product });
};

const create = (req, res) => {
  const product = products.create(validateBody(req.body));
  res.status(201).location(`/api/products/${product.id}`).json({ data: product });
};

const replace = (req, res) => {
  const id = parseId(req.params.id);
  const updated = products.replace(id, validateBody(req.body));
  if (!updated) throw ApiError.notFound(`Товар с id=${id} не найден`);
  res.json({ data: updated });
};

const remove = (req, res) => {
  const id = parseId(req.params.id);
  const deleted = products.remove(id);
  if (!deleted) throw ApiError.notFound(`Товар с id=${id} не найден`);
  res.status(204).end();
};

module.exports = { list, getOne, create, replace, remove };