const { Router } = require('express');
const controller = require('../controllers/orders.controller');

const router = Router();

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', controller.checkout);
router.put('/:id', controller.replace);
router.patch('/:id/status', controller.changeStatus);
router.delete('/:id', controller.remove);

module.exports = router;