const { UniqueConstraintError } = require('sequelize');
const { sequelize, CartItem, Product } = require('../db/models');

const toDTO = item => ({
  id: item.id,
  productId: item.productId,
  title: item.product ? item.product.title : item.title,
  category: item.product ? item.product.category : null,
  color: item.product ? item.product.color : '',
  sizes: item.product ? item.product.sizes : [item.size],
  stock: item.product ? item.product.stock : null,
  size: item.size,
  price: item.product ? Number(item.product.price) : Number(item.price),
  quantity: item.quantity,
  createdAt: item.createdAt
});

const getItems = async userId => {
  const items = await CartItem.findAll({
    where: { userId },
    include: [{ model: Product, as: 'product' }],
    order: [['id', 'ASC']]
  });
  return items.map(toDTO);
};

const findItem = (userId, id) => CartItem.findOne({ where: { id, userId } });

const findSame = (userId, productId, size) => CartItem.findOne({ where: { userId, productId, size } });

const addItem = async ({ userId, productId, title, size, price, quantity }) => {
  try {
    return await sequelize.transaction(async transaction => {
      const existing = await CartItem.findOne({
        where: { userId, productId, size },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (existing) {
        return existing.increment('quantity', { by: quantity, transaction });
      }
      return CartItem.create({ userId, productId, title, size, price, quantity }, { transaction });
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      const existing = await findSame(userId, productId, size);
      return existing.increment('quantity', { by: quantity });
    }
    throw err;
  }
};

const findItemWithProduct = (userId, id) =>
  CartItem.findOne({ where: { id, userId }, include: [{ model: Product, as: 'product' }] });

const updateItem = async (userId, id, changes) => {
  const item = await findItem(userId, id);
  if (!item) return null;
  return item.update(changes);
};

const removeItem = async (userId, id) => {
  const item = await findItem(userId, id);
  if (!item) return null;
  await item.destroy();
  return item;
};

const clear = (userId, transaction) => CartItem.destroy({ where: { userId }, transaction });

const total = items =>
  Number(items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0).toFixed(2));

module.exports = {
  getItems, findItem, findItemWithProduct, findSame, addItem, updateItem, removeItem, clear, total
};
