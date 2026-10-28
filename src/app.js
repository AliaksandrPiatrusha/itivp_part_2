const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// React-клиент (лаб. №25) работает на другом origin (Vite, порт 5173), поэтому браузеру
// нужно разрешение CORS. Список origin задаётся через CORS_ORIGIN (через запятую).
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    name: 'Clothing Store API',
    endpoints: ['/api/auth', '/api/profile', '/api/users', '/api/products', '/api/cart', '/api/orders']
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;


