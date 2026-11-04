const Product = require('../models/Product');
const Cart = require('../models/Cart');
const ApiError = require('../../utils/ApiError');
const {
  requireFields, parseObjectId, queryString, escapeRegex
} = require('../../utils/validators');

const FIELDS = ['title', 'category', 'sizes', 'color', 'price', 'stock', 'discountPercent', 'tags'];

const pick = body => FIELDS.reduce((acc, f) => {
  if (body[f] !== undefined) acc[f] = body[f];
  return acc;
}, {});

const parsePaging = ({ limit, offset }) => {
  const result = { limit: null, offset: 0 };
  if (limit !== undefined) {
    const n = Number(limit);
    if (!Number.isInteger(n) || n < 1 || n > 100) throw ApiError.badRequest('Параметр limit должен быть целым числом от 1 до 100');
    result.limit = n;
  }
  if (offset !== undefined) {
    const n = Number(offset);
    if (!Number.isInteger(n) || n < 0) throw ApiError.badRequest('Параметр offset должен быть целым неотрицательным числом');
    result.offset = n;
  }
  return result;
};

const list = async (req, res) => {
  const category = queryString(req.query.category);
  const size = queryString(req.query.size);
  const tag = queryString(req.query.tag);
  const search = queryString(req.query.search);
  const maxPrice = queryString(req.query.maxPrice);
  const { limit, offset } = parsePaging(req.query);

  const filter = {};
  if (category) filter.category = category;
  if (size) filter.sizes = size;
  if (tag) filter.tags = tag;
  if (maxPrice !== undefined) {
    const max = Number(maxPrice);
    if (!Number.isFinite(max)) throw ApiError.badRequest('Параметр maxPrice должен быть числом');
    filter.price = { $lte: max };
  }
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: pattern }, { color: pattern }];
  }

  const query = Product.find(filter).sort({ createdAt: 1, _id: 1 }).skip(offset);
  if (limit) query.limit(limit);

  const [rows, total] = await Promise.all([query, Product.countDocuments(filter)]);
  res.json({
    data: rows,
    meta: { total, limit, offset, hasMore: limit ? offset + rows.length < total : false }
  });
};

const getOne = async (req, res) => {
  const id = parseObjectId(req.params.id);
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound(`Товар с id=${id} не найден`);
  res.json({ data: product });
};

const create = async (req, res) => {
  requireFields(req.body, ['title', 'category', 'sizes', 'price']);
  const product = await Product.create(pick(req.body));
  res.status(201).location(`/api/mongo/products/${product.id}`).json({ data: product });
};

const replace = async (req, res) => {
  const id = parseObjectId(req.params.id);
  requireFields(req.body, ['title', 'category', 'sizes', 'price', 'stock']);
  const product = await Product.findByIdAndUpdate(id, pick(req.body), { new: true, runValidators: true });
  if (!product) throw ApiError.notFound(`Товар с id=${id} не найден`);
  res.json({ data: product });
};

const remove = async (req, res) => {
  const id = parseObjectId(req.params.id);
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) throw ApiError.notFound(`Товар с id=${id} не найден`);
  const { modifiedCount } = await Cart.updateMany(
    { 'items.product': deleted._id },
    { $pull: { items: { product: deleted._id } } }
  );
  res.json({ data: deleted, meta: { cartsUpdated: modifiedCount } });
};

const addReview = async (req, res) => {
  const id = parseObjectId(req.params.id);
  requireFields(req.body, ['rating']);
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw ApiError.badRequest('Поле rating должно быть целым числом от 1 до 5');
  }
  const comment = typeof req.body.comment === 'string' ? req.body.comment : '';

  const product = await Product.findByIdAndUpdate(
    id,
    { $push: { reviews: { userId: req.user.id, author: req.user.email, rating, comment } } },
    { new: true, runValidators: true }
  );
  if (!product) throw ApiError.notFound(`Товар с id=${id} не найден`);
  const review = product.reviews[product.reviews.length - 1];
  res.status(201).json({ data: { review, rating: product.rating, reviewsCount: product.reviews.length } });
};

const removeReview = async (req, res) => {
  const id = parseObjectId(req.params.id);
  const reviewId = parseObjectId(req.params.reviewId);
  const match = { _id: reviewId };
  if (req.user.role !== 'admin') match.userId = req.user.id;

  const product = await Product.findOneAndUpdate(
    { _id: id, reviews: { $elemMatch: match } },
    { $pull: { reviews: { _id: reviewId } } },
    { new: true }
  );
  if (!product) throw ApiError.notFound(`Отзыв с id=${reviewId} не найден`);
  res.json({ data: { rating: product.rating, reviewsCount: product.reviews.length } });
};

module.exports = { list, getOne, create, replace, remove, addReview, removeReview };
