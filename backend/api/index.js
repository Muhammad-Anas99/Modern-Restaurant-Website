// Vercel serverless entry point. Any file under /api becomes an endpoint; combined
// with the rewrite in vercel.json, every request (any path) is routed to this one
// function, and the Express app inside server.js handles its own internal routing.
module.exports = require('../server');
