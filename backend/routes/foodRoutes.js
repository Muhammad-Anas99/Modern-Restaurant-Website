const express = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/foodController');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', requireAuth, ctrl.create);
router.put('/:id', requireAuth, ctrl.update);
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;
