const { Router } = require('express');
const productsRoutes = require('./products.routes');
const cartRoutes = require('./cart.routes');
const ordersRoutes = require('./orders.routes');

const router = Router();

router.use('/products', productsRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', ordersRoutes);

module.exports = router;