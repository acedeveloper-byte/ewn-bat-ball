const cron = require('node-cron');
const { autoSubmitResult } = require('./autoSubmit');

function scheduleJobOnNextQuarterHour(taskFunction) {
	const now = new Date();
	const minutes = now.getMinutes();
	const nextQuarter = Math.ceil((minutes + 1) / 15) * 15;
	let delayMinutes = nextQuarter - minutes;
	if (delayMinutes >= 60) delayMinutes -= 60;
	const delayMs = delayMinutes * 60 * 1000;

	console.log(`Scheduler will start in ${delayMinutes} minute(s)`);

	setTimeout(() => {
		taskFunction(); // Run once on next quarter hour
		cron.schedule('*/15 * * * *', taskFunction); // Run every 15 mins thereafter
	}, delayMs);
}

scheduleJobOnNextQuarterHour(autoSubmitResult);
