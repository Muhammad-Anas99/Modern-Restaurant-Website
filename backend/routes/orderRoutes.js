const express = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/orderController');

const router = express.Router();

router.post('/', ctrl.create);
router.get('/', requireAuth, ctrl.list);
router.get('/stats', requireAuth, ctrl.stats);
router.get('/:id', requireAuth, ctrl.getOne);
router.patch('/:id/status', requireAuth, ctrl.updateStatus);

module.exports = router;
