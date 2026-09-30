const { Router } = require('express');
const controller = require('../controllers/products.controller');
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = Router();

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', auth, isAdmin, asyncHandler(controller.create));
router.put('/:id', auth, isAdmin, asyncHandler(controller.replace));
router.delete('/:id', auth, isAdmin, asyncHandler(controller.remove));

module.exports = router;
