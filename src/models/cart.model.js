const { UniqueConstraintError } = require('sequelize');
const { sequelize, CartItem, Product } = require('../db/models');

const toDTO = item => ({
  id: item.id,
  productId: item.productId,
  title: item.product ? item.product.title : item.title,
  size: item.size,
  price: item.product ? Number(item.product.price) : Number(item.price),
  quantity: item.quantity
});

const getItems = async () => {
  const items = await CartItem.findAll({
    include: [{ model: Product, as: 'product' }],
    order: [['id', 'ASC']]
  });
  return items.map(toDTO);
};

const findItem = id => CartItem.findByPk(id);

const findSame = (productId, size) => CartItem.findOne({ where: { productId, size } });

const addItem = async ({ productId, title, size, price, quantity }) => {
  try {
    return await sequelize.transaction(async transaction => {
      const existing = await CartItem.findOne({
        where: { productId, size },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (existing) {
        return existing.increment('quantity', { by: quantity, transaction });
      }
      return CartItem.create({ productId, title, size, price, quantity }, { transaction });
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      const existing = await findSame(productId, size);
      return existing.increment('quantity', { by: quantity });
    }
    throw err;
  }
};

const updateItem = async (id, quantity) => {
  const item = await findItem(id);
  if (!item) return null;
  return item.update({ quantity });
};

const removeItem = async id => {
  const item = await findItem(id);
  if (!item) return null;
  await item.destroy();
  return item;
};

const clear = transaction => CartItem.destroy({ where: {}, transaction });

const total = items =>
  Number(items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0).toFixed(2));

module.exports = { getItems, findItem, findSame, addItem, updateItem, removeItem, clear, total };
