const cart = require('../models/cart.model');
const products = require('../models/products.model');
const ApiError = require('../utils/ApiError');
const { parseId, requireFields, requirePositiveInt } = require('../utils/validators');

const payload = async userId => {
  const items = await cart.getItems(userId);
  return { items, total: cart.total(items) };
};

const view = async (req, res) => {
  res.json({ data: await payload(req.user.id) });
};

const addItem = async (req, res) => {
  requireFields(req.body, ['productId', 'size', 'quantity']);
  const { productId, size, quantity } = req.body;

  const product = await products.findById(Number(productId));
  if (!product) throw ApiError.badRequest(`Товар с id=${productId} не существует`);
  if (!product.sizes.includes(size)) {
    throw ApiError.badRequest(`Размер ${size} недоступен для этого товара`, product.sizes);
  }
  requirePositiveInt(quantity, 'quantity');
  if (quantity > product.stock) {
    throw ApiError.conflict('Недостаточно товара на складе', { stock: product.stock });
  }

  await cart.addItem({
    userId: req.user.id,
    productId: product.id,
    title: product.title,
    size,
    price: product.price,
    quantity
  });
  res.status(201).json({ data: await payload(req.user.id) });
};

const updateItem = async (req, res) => {
  const id = parseId(req.params.itemId);
  requireFields(req.body, ['quantity']);
  requirePositiveInt(req.body.quantity, 'quantity');

  const updated = await cart.updateItem(req.user.id, id, req.body.quantity);
  if (!updated) throw ApiError.notFound(`Позиция корзины с id=${id} не найдена`);
  res.json({ data: await payload(req.user.id) });
};

const removeItem = async (req, res) => {
  const id = parseId(req.params.itemId);
  const deleted = await cart.removeItem(req.user.id, id);
  if (!deleted) throw ApiError.notFound(`Позиция корзины с id=${id} не найдена`);
  res.json({ data: await payload(req.user.id) });
};

const clear = async (req, res) => {
  await cart.clear(req.user.id);
  res.status(204).end();
};

module.exports = { view, addItem, updateItem, removeItem, clear };
