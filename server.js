require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('Не задана переменная окружения JWT_SECRET (см. .env.example)');
  process.exit(1);
}

const app = require('./src/app');
const { sequelize } = require('./src/db/models');
const { connectMongo } = require('./src/mongo/connection');

const PORT = process.env.PORT || 3000;

if (process.env.MONGO_URI) {
  connectMongo(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err.message));
} else {
  console.warn('MONGO_URI не задана: маршруты /api/mongo/* будут возвращать 503');
}

sequelize.authenticate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Не удалось подключиться к базе данных:', err.message);
    process.exit(1);
  });




