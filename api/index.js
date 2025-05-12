const express = require('express');
const app = express();
const serverless = require('serverless-http');
const router = require('../src/router/resultRoutes');
const cors = require('cors');
const loginrouter = require('../src/router/authRouter.js');
const Result2 = require('../src/models/ScrapperResultModel.js');
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

app.post('/api/upload-data', async (req, res) => {
	try {
		const data = req.body;

		// Save each item to the database
		for (const item of data) {
			const newItem = new Result2(item);
			await newItem.save();
		}

		res.status(200).json({ message: 'Data successfully uploaded' });
	} catch (err) {
		res
			.status(500)
			.json({ message: 'Error uploading data', error: err.message });
	}
});

// app.listen(5000);
// Export handler for Vercel
module.exports = app;

module.exports.handler = serverless(app);
