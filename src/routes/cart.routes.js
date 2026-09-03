const { Router } = require('express');
const controller = require('../controllers/cart.controller');

const router = Router();

router.get('/', controller.view);
router.post('/items', controller.addItem);
router.put('/items/:itemId', controller.updateItem);
router.delete('/items/:itemId', controller.removeItem);
router.delete('/', controller.clear);

module.exports = router;