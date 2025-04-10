const express = require('express');
const app = express();
const serverless = require('serverless-http');
const router = require('../src/router/resultRoutes');
require("../src/config/dbconnect.js")
// Middleware
app.use(express.json());
app.use("/api", router)
// Sample route
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from Vercel Serverless!' });
});




// Export handler for Vercel
module.exports = app;

module.exports.handler = serverless(app);
