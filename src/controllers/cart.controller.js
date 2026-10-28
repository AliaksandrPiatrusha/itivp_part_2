const cart = require('../models/cart.model');
const products = require('../models/products.model');
const ApiError = require('../utils/ApiError');
const { parseId, requireFields, requirePositiveInt } = require('../utils/validators');

// Ответ всегда содержит актуальную корзину; для операций с одной позицией дополнительно
// возвращается сама позиция (item) — клиент заменяет ею временную/оптимистичную запись.
const payload = async (userId, itemId) => {
  const items = await cart.getItems(userId);
  const result = { items, total: cart.total(items) };
  if (itemId !== undefined) result.item = items.find(i => i.id === itemId) || null;
  return result;
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
  const saved = await cart.findSame(req.user.id, product.id, size);
  res.status(201).json({ data: await payload(req.user.id, saved.id) });
};

// Изменение количества и/или размера позиции.
const updateItem = async (req, res) => {
  const id = parseId(req.params.itemId);
  if (!req.body || typeof req.body !== 'object') {
    throw ApiError.badRequest('Тело запроса должно быть JSON-объектом');
  }
  const { quantity, size } = req.body;
  if (quantity === undefined && size === undefined) {
    throw ApiError.badRequest('Отсутствуют обязательные поля', ['quantity', 'size']);
  }

  const item = await cart.findItemWithProduct(req.user.id, id);
  if (!item) throw ApiError.notFound(`Позиция корзины с id=${id} не найдена`);

  const changes = {};
  if (quantity !== undefined) {
    requirePositiveInt(quantity, 'quantity');
    if (item.product && quantity > item.product.stock) {
      throw ApiError.conflict('Недостаточно товара на складе', { stock: item.product.stock });
    }
    changes.quantity = quantity;
  }
  if (size !== undefined && size !== item.size) {
    if (item.product && !item.product.sizes.includes(size)) {
      throw ApiError.badRequest(`Размер ${size} недоступен для этого товара`, item.product.sizes);
    }
    if (await cart.findSame(req.user.id, item.productId, size)) {
      throw ApiError.conflict(`Товар размера ${size} уже есть в корзине`);
    }
    changes.size = size;
  }

  await cart.updateItem(req.user.id, id, changes);
  res.json({ data: await payload(req.user.id, id) });
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
