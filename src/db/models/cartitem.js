'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CartItem extends Model {
    static associate(models) {
      CartItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    }
  }
  CartItem.init({
    productId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    size: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    sequelize,
    modelName: 'CartItem',
    indexes: [{ unique: true, fields: ['productId', 'size'] }]
  });
  return CartItem;
};



