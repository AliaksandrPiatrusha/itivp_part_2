const express = require('express');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    name: 'Clothing Store API',
    endpoints: ['/api/products', '/api/cart', '/api/orders']
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;


