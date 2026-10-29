const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : [/^http:\/\/(localhost|127\.0\.0\.1):\d+$/];

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

