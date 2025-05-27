const axios = require('axios');
const moment = require('moment');

const HOST = 'https://13.61.215.183/api'; // Replace with your backend API base URL

async function autoSubmitResult() {
	try {
		const now = moment().add(15, 'minutes');
		// Round to the next quarter-hour
		console.log('now', now);
		const rounded = now
			.clone()
			.startOf('minute')
			.add(15 - (now.minute() % 15), 'minutes');

		const next = rounded.clone().add(15, 'minutes');

		// Random number between 01 and 99
		const randomNum = Math.floor(Math.random() * 99) + 1;
		const formattedNumber = randomNum.toString().padStart(2, '0');

		// Time in both formats
		const formattedTime12 = rounded.format('hh:mm A'); // 12-hour format
		const formattedTime24 = rounded.format('HH:mm'); // 24-hour format

		// Prepare payload
		const postData = {
			categoryname: 'Minidiswar',
			time: formattedTime24, // time in 24-hour format
			number: formattedNumber, // always updated
			next_result: next.format('YYYY-MM-DDTHH:mm:ss'), // ISO 24-hour format
			result: [
				{
					time: formattedTime12,
					number: formattedNumber,
				},
			],
			date: now.format('YYYY-MM-DD'),
			key: 'md-9281',
		};

		// Submit to backend
		const resultRes = await axios.post(
			`${HOST}/result-with-authcode`,
			postData,
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);

		console.log('Result submitted successfully:', resultRes.data);
		return resultRes.data;
	} catch (error) {
		console.error('Error in autoSubmitResult:', error.message);
		throw error;
	}
}

module.exports = { autoSubmitResult };
