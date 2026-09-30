const { Router } = require('express');
const controller = require('../controllers/users.controller');
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = Router();

router.use(auth, isAdmin);

router.get('/', asyncHandler(controller.list));
router.patch('/:id/role', asyncHandler(controller.changeRole));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
