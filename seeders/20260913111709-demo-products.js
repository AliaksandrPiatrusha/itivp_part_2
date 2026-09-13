'use strict';
/** @type {import('sequelize-cli').Seed} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('Products', [
      {
        title: 'Футболка Oversize',
        category: 'tshirts',
        sizes: JSON.stringify(['S', 'M', 'L']),
        color: 'чёрный',
        price: 39.9,
        stock: 25,
        discountPercent: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        title: 'Джинсы Slim Fit',
        category: 'jeans',
        sizes: JSON.stringify(['M', 'L', 'XL']),
        color: 'синий',
        price: 89.0,
        stock: 14,
        discountPercent: 10,
        createdAt: now,
        updatedAt: now
      },
      {
        title: 'Худи Basic',
        category: 'hoodies',
        sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
        color: 'серый',
        price: 74.5,
        stock: 8,
        discountPercent: 0,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('Products', {
      title: ['Футболка Oversize', 'Джинсы Slim Fit', 'Худи Basic']
    }, {});
  }
};
