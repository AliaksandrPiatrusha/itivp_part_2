const { Router } = require('express');
const products = require('./controllers/products.controller');
const cart = require('./controllers/cart.controller');
const orders = require('./controllers/orders.controller');
const { requireMongo } = require('./connection');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.use(requireMongo);

router.get('/products', asyncHandler(products.list));
router.get('/products/:id', asyncHandler(products.getOne));
router.post('/products', auth, isAdmin, asyncHandler(products.create));
router.put('/products/:id', auth, isAdmin, asyncHandler(products.replace));
router.delete('/products/:id', auth, isAdmin, asyncHandler(products.remove));
router.post('/products/:id/reviews', auth, asyncHandler(products.addReview));
router.delete('/products/:id/reviews/:reviewId', auth, asyncHandler(products.removeReview));

router.get('/cart', auth, asyncHandler(cart.view));
router.post('/cart/items', auth, asyncHandler(cart.addItem));
router.patch('/cart/items/:itemId', auth, asyncHandler(cart.updateItem));
router.delete('/cart/items/:itemId', auth, asyncHandler(cart.removeItem));
router.delete('/cart', auth, asyncHandler(cart.clear));

router.get('/orders', auth, asyncHandler(orders.list));
router.get('/orders/stats', auth, isAdmin, asyncHandler(orders.stats));
router.get('/orders/:id', auth, asyncHandler(orders.getOne));
router.post('/orders', auth, asyncHandler(orders.checkout));
router.put('/orders/:id', auth, isAdmin, asyncHandler(orders.replace));
router.patch('/orders/:id/status', auth, isAdmin, asyncHandler(orders.changeStatus));
router.delete('/orders/:id', auth, isAdmin, asyncHandler(orders.remove));

module.exports = router;
