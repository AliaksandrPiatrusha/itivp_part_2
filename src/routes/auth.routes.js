const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.post('/register', asyncHandler(controller.register));
router.post('/login', asyncHandler(controller.login));

module.exports = router;
