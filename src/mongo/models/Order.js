const { Schema, model } = require('mongoose');

const STATUSES = ['new', 'paid', 'shipped', 'delivered', 'cancelled'];

const customerSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true, default: '' },
  address: { type: String, required: true, trim: true }
}, { _id: false });

const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 }
});

const statusChangeSchema = new Schema({
  status: { type: String, enum: STATUSES, required: true },
  changedAt: { type: Date, default: Date.now }
}, { _id: false });

const calcTotal = items =>
  Number(items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0).toFixed(2));

const orderSchema = new Schema({
  userId: { type: Number, required: true, index: true },
  customer: { type: customerSchema, required: true },
  items: {
    type: [orderItemSchema],
    validate: { validator: v => v.length > 0, message: 'Заказ должен содержать хотя бы одну позицию' }
  },
  total: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: STATUSES, default: 'new', index: true },
  statusHistory: { type: [statusChangeSchema], default: [] }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true }
});

orderSchema.pre('validate', function () {
  this.total = calcTotal(this.items);
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({ status: this.status });
  }
});

orderSchema.statics.calcTotal = calcTotal;

const Order = model('Order', orderSchema);
Order.STATUSES = STATUSES;

module.exports = Order;
