const { Router } = require('express');
const controller = require('../controllers/orders.controller');
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = Router();

router.use(auth);

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', asyncHandler(controller.checkout));
router.put('/:id', isAdmin, asyncHandler(controller.replace));
router.patch('/:id/status', isAdmin, asyncHandler(controller.changeStatus));
router.delete('/:id', isAdmin, asyncHandler(controller.remove));

module.exports = router;
