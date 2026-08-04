const express = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

const router = express.Router();

router.post('/login', ctrl.login);
router.get('/me', requireAuth, ctrl.me);

module.exports = router;
