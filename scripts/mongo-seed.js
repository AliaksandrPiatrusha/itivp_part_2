require('dotenv').config();
const { mongoose, connectMongo } = require('../src/mongo/connection');
const Product = require('../src/mongo/models/Product');
const Cart = require('../src/mongo/models/Cart');
const Order = require('../src/mongo/models/Order');

const products = [
  {
    title: 'Футболка Oversize', category: 'tshirts', sizes: ['S', 'M', 'L'], color: 'чёрный',
    price: 39.9, stock: 25, tags: ['хлопок', 'базовое'],
    reviews: [{ userId: 1, author: 'admin@shop.local', rating: 5, comment: 'Отличная посадка' }]
  },
  {
    title: 'Джинсы Slim Fit', category: 'jeans', sizes: ['M', 'L', 'XL'], color: 'синий',
    price: 89, stock: 14, discountPercent: 10, tags: ['деним']
  },
  {
    title: 'Худи Basic', category: 'hoodies', sizes: ['S', 'M', 'L', 'XL'], color: 'серый',
    price: 74.5, stock: 8, tags: ['хлопок', 'тёплое']
  },
  {
    title: 'Куртка джинсовая', category: 'jackets', sizes: ['S', 'M', 'L'], color: 'синий',
    price: 139, stock: 6, tags: ['деним', 'верхняя одежда']
  },
  {
    title: 'Пуховик Urban', category: 'jackets', sizes: ['M', 'L', 'XL', 'XXL'], color: 'хаки',
    price: 259, stock: 4, tags: ['тёплое', 'верхняя одежда']
  },
  {
    title: 'Кеды Canvas', category: 'shoes', sizes: ['38', '39', '40', '41', '42', '43'], color: 'белый',
    price: 79, stock: 20, tags: ['обувь']
  }
];

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error('Не задана переменная MONGO_URI');
  await connectMongo(process.env.MONGO_URI);
  await Promise.all([Product.deleteMany({}), Cart.deleteMany({}), Order.deleteMany({})]);
  await Promise.all([Product.syncIndexes(), Cart.syncIndexes(), Order.syncIndexes()]);
  const created = await Product.insertMany(products);
  console.log(`MongoDB: добавлено товаров — ${created.length}`);
};

run()
  .catch(err => {
    console.error('Ошибка сида MongoDB:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
