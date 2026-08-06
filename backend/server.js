require('dotenv').config();
require('express-async-errors'); // lets async controller functions throw and reach the error handler below
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const offerRoutes = require('./routes/offerRoutes');
const promoCodeRoutes = require('./routes/promoCodeRoutes');
const orderRoutes = require('./routes/orderRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Ensures MongoDB is connected before any data route runs. Uses the cached connection
// from config/db.js, so on a warm serverless invocation this resolves instantly.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    res.status(503).json({ message: 'Database is unavailable right now. Please try again shortly.' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/uploads', uploadRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

// Central error handler — catches thrown/rejected errors from async route handlers
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(' ') });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with that value already exists.' });
  }
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong on our end.' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

const PORT = process.env.PORT || 5000;

// Only bind a port for local/traditional hosting (`node server.js` or `npm run dev`).
// On Vercel this file is required as a module by api/index.js, so require.main !== module
// and app.listen() never runs — the platform's own HTTP layer handles each request instead.
if (require.main === module) {
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`Foundry & Flame API running on port ${PORT}`)))
    .catch((err) => {
      console.error('Failed to connect to MongoDB, server not started:', err.message);
      process.exit(1);
    });
}

module.exports = app;
