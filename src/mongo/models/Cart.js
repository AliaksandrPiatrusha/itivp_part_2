const { Schema, model } = require('mongoose');

const cartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 }
}, { timestamps: { createdAt: true, updatedAt: false } });

const cartSchema = new Schema({
  userId: { type: Number, required: true, unique: true },
  items: { type: [cartItemSchema], default: [] }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true }
});

cartSchema.virtual('total').get(function () {
  return Number(this.items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2));
});

cartSchema.methods.quantityOf = function (productId, excludeItemId) {
  return this.items
    .filter(i => String(i.product._id || i.product) === String(productId))
    .filter(i => !excludeItemId || String(i._id) !== String(excludeItemId))
    .reduce((sum, i) => sum + i.quantity, 0);
};

module.exports = model('Cart', cartSchema);
