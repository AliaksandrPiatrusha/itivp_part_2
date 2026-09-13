const { Op } = require('sequelize');
const { Product } = require('../db/models');

const findAll = async ({ category, size, maxPrice } = {}) => {
  const where = {};
  if (category) where.category = category;
  if (maxPrice !== undefined) {
    const max = Number(maxPrice);
    if (Number.isFinite(max)) where.price = { [Op.lte]: max };
  }

  const products = await Product.findAll({ where, order: [['id', 'ASC']] });
  return size ? products.filter(p => p.sizes.includes(size)) : products;
};

const findById = id => Product.findByPk(id);

const findByIdForUpdate = (id, transaction) =>
  Product.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });

const create = data => Product.create(data);

const replace = async (id, data) => {
  const product = await Product.findByPk(id);
  if (!product) return null;
  return product.update(data);
};

const remove = async id => {
  const product = await Product.findByPk(id);
  if (!product) return null;
  await product.destroy();
  return product;
};

const decreaseStock = (id, quantity, transaction) =>
  Product.decrement('stock', { by: quantity, where: { id }, transaction });

module.exports = { findAll, findById, findByIdForUpdate, create, replace, remove, decreaseStock };
