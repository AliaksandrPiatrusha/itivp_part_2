'use strict';
const { Model } = require('sequelize');

const ROLES = ['user', 'admin'];

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.CartItem, { foreignKey: 'userId', as: 'cartItems', onDelete: 'CASCADE' });
      User.hasMany(models.Order, { foreignKey: 'userId', as: 'orders' });
    }
  }
  User.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM(...ROLES), allowNull: false, defaultValue: 'user' }
  }, {
    sequelize,
    modelName: 'User'
  });
  User.ROLES = ROLES;
  return User;
};
