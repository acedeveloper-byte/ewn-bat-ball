const cron = require('node-cron');
const { autoSubmitResult } = require('./autoSubmit');

function scheduleJobOneMinuteBeforeQuarter(taskFunction) {
	const now = new Date();
	const minutes = now.getMinutes();
	const seconds = now.getSeconds();
	const ms = now.getMilliseconds();

	// How many minutes until the next quarter hour?
	const remainder = minutes % 15;
	// Target is *one minute before* the next quarter
	let delayMinutes = 14 - remainder; // 14 instead of 15
	if (delayMinutes < 0) {
		// we’ve already passed the 14th minute of this quarter
		delayMinutes += 15;
	}

	const delayMs = delayMinutes * 60 * 1000 - (seconds * 1000 + ms);

	const nextRunTime = new Date(now.getTime() + delayMs);
	console.log(
		`Scheduler will start at ${nextRunTime.toLocaleTimeString()} (in ${Math.round(
			delayMs / 60000
		)} minute(s))`
	);

	setTimeout(() => {
		taskFunction(); // run once at the adjusted time
		// Then every 15 mins, but one minute earlier each quarter: 14,29,44,59
		cron.schedule('14,29,44,59 * * * *', taskFunction);
	}, delayMs);
}

scheduleJobOneMinuteBeforeQuarter(autoSubmitResult);

// // const cron = require("node-cron");
// // const { autoSubmitResult } = require("./autoSubmit");

// // cron.schedule("*/15 * * * * *", async () => {
// //   const now = new Date();
// //   console.log(`Running autoSubmitResult at ${now.toLocaleTimeString()}`);

// //   try {
// //     await autoSubmitResult();
// //   } catch (error) {
// //     console.error("Error in autoSubmitResult:", error.message);
// //   }
// // });
