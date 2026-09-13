const { Router } = require('express');
const controller = require('../controllers/cart.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.view));
router.post('/items', asyncHandler(controller.addItem));
router.put('/items/:itemId', asyncHandler(controller.updateItem));
router.delete('/items/:itemId', asyncHandler(controller.removeItem));
router.delete('/', asyncHandler(controller.clear));

module.exports = router;
