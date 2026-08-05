const mongoose = require('mongoose');

/**
 * Vercel serverless functions can reuse a "warm" process between invocations, so we
 * cache the connection on the global object instead of reconnecting on every request
 * (which would exhaust MongoDB's connection limit under load). Locally this just
 * connects once, the same as before.
 */
let cached = global.__mongooseConn;
if (!cached) {
  cached = global.__mongooseConn = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set. Add it to your .env file (or your Vercel project environment variables).');
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose.connect(uri, { bufferCommands: false }).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // let the next request retry instead of caching a failed connection
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;
