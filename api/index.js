const express = require('express');
const app = express();
const serverless = require('serverless-http');

// Middleware
app.use(express.json());

// Sample route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Vercel Serverless!' });
});

// Export handler for Vercel
module.exports = app;
module.exports.handler = serverless(app);
