// const cron = require("node-cron");
// const { autoSubmitResult } = require("./autoSubmit");

// function scheduleJobOnNextQuarterHour(taskFunction) {
//   const now = new Date();
//   const minutes = now.getMinutes();
//   const seconds = now.getSeconds();
//   const ms = now.getMilliseconds();

//   // Calculate minutes to add to reach the next quarter hour
//   const remainder = minutes % 15;
//   let delayMinutes = 15 - remainder;
//   if (remainder === 0 && (seconds > 0 || ms > 0)) {
//     // It's exactly on a quarter mark but already passed the exact minute
//     delayMinutes = 15;
//   }

//   const delayMs = delayMinutes * 60 * 1000 - (seconds * 1000 + ms);

//   const nextRunTime = new Date(now.getTime() + delayMs);
//   console.log(
//     `Scheduler will start at ${nextRunTime.toLocaleTimeString()} (in ${Math.round(
//       delayMs / 60000
//     )} minute(s))`
//   );

//   setTimeout(() => {
//     taskFunction(); // Run once on the next quarter hour
//     cron.schedule("*/15 * * * *", taskFunction); // Repeat every 15 mins
//   }, delayMs);
// }

// scheduleJobOnNextQuarterHour(autoSubmitResult);

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
