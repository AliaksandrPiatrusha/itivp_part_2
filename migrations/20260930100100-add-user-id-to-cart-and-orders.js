'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.bulkDelete('CartItems', {}, { transaction });
      await queryInterface.removeIndex('CartItems', 'cart_items_product_id_size_unique', { transaction });
      await queryInterface.addColumn('CartItems', 'userId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });
      await queryInterface.addIndex('CartItems', ['userId', 'productId', 'size'], {
        unique: true,
        name: 'cart_items_user_id_product_id_size_unique',
        transaction
      });

      await queryInterface.addColumn('Orders', 'userId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('Orders', 'userId', { transaction });
      await queryInterface.bulkDelete('CartItems', {}, { transaction });
      await queryInterface.removeIndex('CartItems', 'cart_items_user_id_product_id_size_unique', { transaction });
      await queryInterface.removeColumn('CartItems', 'userId', { transaction });
      await queryInterface.addIndex('CartItems', ['productId', 'size'], {
        unique: true,
        name: 'cart_items_product_id_size_unique',
        transaction
      });
    });
  }
};
