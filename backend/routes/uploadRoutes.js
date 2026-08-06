const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/uploadController');

const router = express.Router();

// Memory storage only — Vercel's filesystem is read-only/ephemeral, so the file is
// held in memory just long enough to stream it to Vercel Blob, never written to disk.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', requireAuth, upload.single('image'), ctrl.uploadImage);

module.exports = router;
