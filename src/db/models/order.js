'use strict';
const { Model } = require('sequelize');

const STATUSES = ['new', 'paid', 'shipped', 'delivered', 'cancelled'];

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.hasMany(models.OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
    }
  }
  Order.init({
    customerName: { type: DataTypes.STRING, allowNull: false },
    customerEmail: { type: DataTypes.STRING, allowNull: false },
    customerPhone: { type: DataTypes.STRING },
    customerAddress: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'new' },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'Order'
  });
  Order.STATUSES = STATUSES;
  return Order;
};





