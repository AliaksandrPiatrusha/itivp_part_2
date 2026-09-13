const { Router } = require('express');
const controller = require('../controllers/orders.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', asyncHandler(controller.checkout));
router.put('/:id', asyncHandler(controller.replace));
router.patch('/:id/status', asyncHandler(controller.changeStatus));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
