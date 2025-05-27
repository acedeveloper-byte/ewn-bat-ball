const express = require('express');
const app = express();
const serverless = require('serverless-http');
const router = require('./src/router/resultRoutes.js');
const cors = require('cors');
const loginrouter = require('./src/router/authRouter.js');
const Result2 = require('./src/models/ScrapperResultModel.js');
require('./src/config/dbconnect.js');
require('./src/scheduler.js');
// Middleware
app.use(cors());

app.use(express.json());
app.use('/api', router);
app.use('/api', loginrouter);

// Sample route
app.get('/api/hello', (req, res) => {
	res.json({ message: 'Hello from Vercel Serverless!' });
});

// Helper function to convert 24-hour time to 12-hour format
function convertTo12HourFormat(time24) {
	const [hourStr, minute] = time24.split(':');
	let hour = parseInt(hourStr, 10);
	const ampm = hour >= 12 ? 'PM' : 'AM';
	hour = hour % 12 || 12; // Convert 0 (midnight) or 12 (noon) to 12
	return `${hour.toString().padStart(2, '0')}:${minute} ${ampm}`;
}

app.post('/api/upload-data', async (req, res) => {
	try {
		const data = req.body;

		for (const item of data) {
			const { categoryname, result, date, number, next_result } = item;

			// Convert result times to 12-hour format
			const newResults = Array.isArray(result)
				? result.map((r) => ({
						...r,
						time: convertTo12HourFormat(r.time),
				  }))
				: [];

			// Convert next_result to 12-hour format (if it exists)
			const formattedNextResult = next_result
				? convertTo12HourFormat(next_result)
				: null;

			// Create and save a new document
			const newItem = new Result2({
				categoryname,
				date,
				result: newResults,
				number,
				next_result: formattedNextResult,
			});

			await newItem.save();
		}

		res.status(200).json({ message: 'Data successfully uploaded' });
	} catch (err) {
		res.status(500).json({
			message: 'Error uploading data',
			error: err.message,
		});
	}
});

app.listen(5000);
// Export handler for Vercel
module.exports = app;

// module.exports.handler = serverless(app);
