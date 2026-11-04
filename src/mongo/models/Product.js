const { Schema, model } = require('mongoose');

const reviewSchema = new Schema({
  userId: { type: Number, required: true },
  author: { type: String, trim: true, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, default: '' }
}, { timestamps: { createdAt: true, updatedAt: false } });

const productSchema = new Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true, index: true },
  sizes: {
    type: [{ type: String, trim: true }],
    validate: { validator: v => v.length > 0, message: 'Нужно указать хотя бы один размер' }
  },
  color: { type: String, trim: true, default: '' },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  discountPercent: { type: Number, min: 0, max: 100, default: 0 },
  tags: { type: [String], index: true, default: [] },
  reviews: { type: [reviewSchema], default: [] }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true }
});

productSchema.virtual('finalPrice').get(function () {
  return Number((this.price * (1 - this.discountPercent / 100)).toFixed(2));
});

productSchema.virtual('rating').get(function () {
  if (!this.reviews || this.reviews.length === 0) return null;
  const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
  return Number((sum / this.reviews.length).toFixed(2));
});

productSchema.methods.hasSize = function (size) {
  return this.sizes.includes(size);
};

productSchema.statics.findByTag = function (tag) {
  return this.find({ tags: tag });
};

module.exports = model('Product', productSchema);
