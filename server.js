require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('Не задана переменная окружения JWT_SECRET (см. .env.example)');
  process.exit(1);
}

const app = require('./src/app');
const { sequelize } = require('./src/db/models');

const PORT = process.env.PORT || 3000;

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




