const cart = require('../models/cart.model');
const products = require('../models/products.model');
const ApiError = require('../utils/ApiError');
const { parseId, requireFields, requirePositiveInt } = require('../utils/validators');

const payload = () => ({ items: cart.getItems(), total: cart.total() });

const view = (req, res) => {
  res.json({ data: payload() });
};

const addItem = (req, res) => {
  requireFields(req.body, ['productId', 'size', 'quantity']);
  const { productId, size, quantity } = req.body;

  const product = products.findById(Number(productId));
  if (!product) throw ApiError.badRequest(`Товар с id=${productId} не существует`);
  if (!product.sizes.includes(size)) {
    throw ApiError.badRequest(`Размер ${size} недоступен для этого товара`, product.sizes);
  }
  requirePositiveInt(quantity, 'quantity');
  if (quantity > product.stock) {
    throw ApiError.conflict('Недостаточно товара на складе', { stock: product.stock });
  }

  cart.addItem({
    productId: product.id,
    title: product.title,
    size,
    price: product.price,
    quantity
  });
  res.status(201).json({ data: payload() });
};

const updateItem = (req, res) => {
  const id = parseId(req.params.itemId);
  requireFields(req.body, ['quantity']);
  requirePositiveInt(req.body.quantity, 'quantity');

  const updated = cart.updateItem(id, req.body.quantity);
  if (!updated) throw ApiError.notFound(`Позиция корзины с id=${id} не найдена`);
  res.json({ data: payload() });
};

const removeItem = (req, res) => {
  const id = parseId(req.params.itemId);
  const deleted = cart.removeItem(id);
  if (!deleted) throw ApiError.notFound(`Позиция корзины с id=${id} не найдена`);
  res.json({ data: payload() });
};

const clear = (req, res) => {
  cart.clear();
  res.status(204).end();
};

module.exports = { view, addItem, updateItem, removeItem, clear };