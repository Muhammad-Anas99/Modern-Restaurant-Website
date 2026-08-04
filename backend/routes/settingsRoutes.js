const express = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/settingsController');

const router = express.Router();

router.get('/', ctrl.get);
router.put('/', requireAuth, ctrl.update);

module.exports = router;
