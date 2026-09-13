require('dotenv').config();

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




