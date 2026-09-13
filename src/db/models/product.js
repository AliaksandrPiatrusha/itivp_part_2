'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.hasMany(models.CartItem, { foreignKey: 'productId', as: 'cartItems' });
      Product.hasMany(models.OrderItem, { foreignKey: 'productId', as: 'orderItems' });
    }
  }
  Product.init({
    title: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    sizes: { type: DataTypes.JSON, allowNull: false },
    color: { type: DataTypes.STRING, defaultValue: '' },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const raw = this.getDataValue('price');
        return raw === null ? null : Number(raw);
      }
    },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    discountPercent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'Product'
  });
  return Product;
};
