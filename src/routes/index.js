const { Router } = require('express');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const productsRoutes = require('./products.routes');
const cartRoutes = require('./cart.routes');
const ordersRoutes = require('./orders.routes');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const authController = require('../controllers/auth.controller');

const router = Router();

router.use('/auth', authRoutes);
router.get('/profile', auth, asyncHandler(authController.profile));
router.use('/users', usersRoutes);
router.use('/products', productsRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', ordersRoutes);

module.exports = router;
