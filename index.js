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
			const {
				categoryname,
				result,
				date,
				number,
				next_result,
				createdAt,
				updatedAt,
				π,
			} = item;

			// Convert each result time to 12-hour format
			const newResults = Array.isArray(result)
				? result.map((r) => ({
						...r,
						time: convertTo12HourFormat(r.time),
				  }))
				: [];

			// Find existing document by categoryname
			const existingDoc = await Result2.findOne({ categoryname });

			if (existingDoc) {
				// Get existing times to avoid duplicates
				const existingTimes = existingDoc.result.map((r) => r.time);
				const filteredResults = newResults.filter(
					(r) => !existingTimes.includes(r.time)
				);

				// Append only new time entries
				if (filteredResults.length > 0) {
					existingDoc.result.push(...filteredResults);
				}

				// Update additional fields
				if (date) existingDoc.date = date;
				if (number !== undefined) existingDoc.number = number;
				if (next_result) existingDoc.next_result = next_result;
				existingDoc.updatedAt = updatedAt || new Date().toISOString();

				await existingDoc.save();
			} else {
				// Create new document if category doesn't exist
				const newItem = new Result2({
					categoryname,
					date,
					result: newResults,
					number,
					next_result,
				});

				await newItem.save();
			}
		}

		res.status(200).json({ message: 'Data successfully uploaded or updated' });
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
