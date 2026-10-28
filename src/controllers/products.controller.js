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
  if (body.discountPercent !== undefined &&
    (!Number.isInteger(body.discountPercent) || body.discountPercent < 0 || body.discountPercent > 100)) {
    throw ApiError.badRequest('Поле discountPercent должно быть целым числом от 0 до 100');
  }
  return {
    title: body.title,
    category: body.category,
    sizes: body.sizes,
    color: body.color || '',
    price: body.price,
    stock: Number.isInteger(body.stock) ? body.stock : 0,
    discountPercent: Number.isInteger(body.discountPercent) ? body.discountPercent : 0
  };
};

const MAX_LIMIT = 100;

// Параметры пагинации ?limit=&offset= (лаб. №25). Без limit возвращается весь список.
const parsePagination = ({ limit, offset }) => {
  const page = { offset: 0 };
  if (limit !== undefined) {
    const value = Number(limit);
    if (!Number.isInteger(value) || value < 1 || value > MAX_LIMIT) {
      throw ApiError.badRequest(`Параметр limit должен быть целым числом от 1 до ${MAX_LIMIT}`);
    }
    page.limit = value;
  }
  if (offset !== undefined) {
    const value = Number(offset);
    if (!Number.isInteger(value) || value < 0) {
      throw ApiError.badRequest('Параметр offset должен быть целым неотрицательным числом');
    }
    page.offset = value;
  }
  return page;
};

const list = async (req, res) => {
  const page = parsePagination(req.query);
  const { rows, total } = await products.findAll(req.query, page);
  res.json({
    data: rows,
    meta: {
      total,
      limit: page.limit ?? null,
      offset: page.offset,
      hasMore: page.offset + rows.length < total
    }
  });
};

const getOne = async (req, res) => {
  const id = parseId(req.params.id);
  const product = await products.findById(id);
  if (!product) throw ApiError.notFound(`Товар с id=${id} не найден`);
  res.json({ data: product });
};

const create = async (req, res) => {
  const product = await products.create(validateBody(req.body));
  res.status(201).location(`/api/products/${product.id}`).json({ data: product });
};

const replace = async (req, res) => {
  const id = parseId(req.params.id);
  const updated = await products.replace(id, validateBody(req.body));
  if (!updated) throw ApiError.notFound(`Товар с id=${id} не найден`);
  res.json({ data: updated });
};

const remove = async (req, res) => {
  const id = parseId(req.params.id);
  const deleted = await products.remove(id);
  if (!deleted) throw ApiError.notFound(`Товар с id=${id} не найден`);
  res.status(204).end();
};

module.exports = { list, getOne, create, replace, remove };
