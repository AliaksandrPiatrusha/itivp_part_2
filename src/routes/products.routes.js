const { Router } = require('express');
const controller = require('../controllers/products.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.replace));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
