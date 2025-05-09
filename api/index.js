const express = require('express');
const app = express();
const serverless = require('serverless-http');
const router = require('../src/router/resultRoutes');
const cors = require('cors');
const loginrouter = require('../src/router/authRouter.js');
require('../src/config/dbconnect.js');
// Middleware
app.use(cors());

app.use(express.json());
app.use('/api', router);
app.use('/api', loginrouter);

// Sample route
app.get('/api/hello', (req, res) => {
	res.json({ message: 'Hello from Vercel Serverless!' });
});

// app.listen(5000);
// Export handler for Vercel
module.exports = app;

module.exports.handler = serverless(app);
