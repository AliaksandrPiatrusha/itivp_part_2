const { Op } = require('sequelize');
const { Product } = require('../db/models');

// Экранирование спецсимволов LIKE, чтобы «%» и «_» в запросе искались буквально.
const escapeLike = value => value.replace(/[\\%_]/g, ch => `\\${ch}`);

// Возвращает { rows, total }: страницу товаров (limit/offset) и общее число подходящих товаров.
const findAll = async ({ category, size, maxPrice, search } = {}, { limit, offset = 0 } = {}) => {
  const where = {};
  if (category) where.category = category;
  // Поиск без учёта регистра по названию и цвету (лаб. №25, поиск с debounce на клиенте).
  const query = typeof search === 'string' ? search.trim() : '';
  if (query) {
    const pattern = `%${escapeLike(query)}%`;
    where[Op.or] = [
      { title: { [Op.iLike]: pattern } },
      { color: { [Op.iLike]: pattern } }
    ];
  }
  if (maxPrice !== undefined) {
    const max = Number(maxPrice);
    if (Number.isFinite(max)) where.price = { [Op.lte]: max };
  }

  // Стабильный порядок по id нужен, чтобы страницы не пересекались и не теряли товары.
  const order = [['id', 'ASC']];

  if (!size) {
    const { rows, count } = await Product.findAndCountAll({
      where,
      order,
      offset,
      ...(limit !== undefined && { limit })
    });
    return { rows, total: count };
  }

  // sizes хранится как JSON, поэтому фильтр по размеру применяется после выборки,
  // а страница вырезается из уже отфильтрованного списка.
  const all = (await Product.findAll({ where, order })).filter(p => p.sizes.includes(size));
  const end = limit !== undefined ? offset + limit : undefined;
  return { rows: all.slice(offset, end), total: all.length };
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
