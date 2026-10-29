'use strict';

const PRODUCTS = [
  { title: 'Футболка Basic белая', category: 'tshirts', sizes: ['XS', 'S', 'M', 'L', 'XL'], color: 'белый', price: 24.9, stock: 40 },
  { title: 'Футболка с принтом City', category: 'tshirts', sizes: ['S', 'M', 'L'], color: 'серый', price: 34.5, stock: 18 },
  { title: 'Поло классическое', category: 'tshirts', sizes: ['M', 'L', 'XL', 'XXL'], color: 'тёмно-синий', price: 49.9, stock: 12 },
  { title: 'Лонгслив Rib', category: 'tshirts', sizes: ['XS', 'S', 'M'], color: 'бежевый', price: 42, stock: 15 },
  { title: 'Джинсы Straight', category: 'jeans', sizes: ['S', 'M', 'L', 'XL'], color: 'голубой', price: 95, stock: 9 },
  { title: 'Джинсы Mom Fit', category: 'jeans', sizes: ['XS', 'S', 'M'], color: 'синий', price: 99.9, stock: 7 },
  { title: 'Джинсы Wide Leg', category: 'jeans', sizes: ['S', 'M', 'L'], color: 'чёрный', price: 109, stock: 5 },
  { title: 'Худи Oversize на молнии', category: 'hoodies', sizes: ['M', 'L', 'XL'], color: 'чёрный', price: 89.9, stock: 10 },
  { title: 'Свитшот College', category: 'hoodies', sizes: ['S', 'M', 'L', 'XL'], color: 'зелёный', price: 69, stock: 14 },
  { title: 'Куртка джинсовая', category: 'jackets', sizes: ['S', 'M', 'L'], color: 'синий', price: 139, stock: 6 },
  { title: 'Пуховик Urban', category: 'jackets', sizes: ['M', 'L', 'XL', 'XXL'], color: 'хаки', price: 259, stock: 4 },
  { title: 'Ветровка Light', category: 'jackets', sizes: ['XS', 'S', 'M', 'L'], color: 'красный', price: 119.5, stock: 0 },
  { title: 'Кеды Canvas', category: 'shoes', sizes: ['38', '39', '40', '41', '42', '43'], color: 'белый', price: 79, stock: 20 },
  { title: 'Кроссовки Runner', category: 'shoes', sizes: ['39', '40', '41', '42', '43', '44'], color: 'серый', price: 159.9, stock: 11 }
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('Products', PRODUCTS.map(p => ({
      ...p,
      sizes: JSON.stringify(p.sizes),
      discountPercent: 0,
      createdAt: now,
      updatedAt: now
    })));
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('Products', { title: PRODUCTS.map(p => p.title) }, {});
  }
};
