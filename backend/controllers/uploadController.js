const { put } = require('@vercel/blob');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

exports.uploadImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file was uploaded.' });
  if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
    return res.status(400).json({ message: 'Only JPEG, PNG, WEBP, GIF, or AVIF images are allowed.' });
  }
  if (req.file.size > MAX_BYTES) {
    return res.status(400).json({ message: 'Image is too large — please keep it under 5MB.' });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      message: 'Image storage is not configured. Add BLOB_READ_WRITE_TOKEN in your environment variables (see backend/README.md).'
    });
  }

  const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '-');
  const key = `menu/${Date.now()}-${safeName}`;

  const blob = await put(key, req.file.buffer, {
    access: 'public',
    contentType: req.file.mimetype,
    token: process.env.BLOB_READ_WRITE_TOKEN
  });

  res.status(201).json({ url: blob.url });
};
