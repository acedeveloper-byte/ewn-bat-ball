const axios = require("axios");
const moment = require("moment");

const HOST = "https://13.61.215.183/api"; // Replace with your backend API base URL

async function autoSubmitResult() {
  try {
    // Calculate next quarter hour times
    const now = moment();
    const rounded = now
      .clone()
      .startOf("minute")
      .add(15 - (now.minute() % 15), "minutes");
    const next = rounded.clone().add(15, "minutes");

    // Generate random number string
    const randomNum = Math.floor(Math.random() * 99) + 1;
    const formattedNumber = randomNum.toString().padStart(2, "0");

    // Prepare post data
    const postData = {
      categoryname: "Minidiswar",
      time: rounded.toISOString(),
      number: formattedNumber,
      next_result: next.toISOString(),
      result: [{ time: rounded.toISOString(), number: formattedNumber }],
      date: moment().format("YYYY-MM-DD"),
      key: "md-9281",
    };

    // Post the result with auth token
    const resultRes = await axios.post(
      `${HOST}/result-with-authcode`,
      postData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Result submitted successfully:", resultRes.data);
    return resultRes.data;
  } catch (error) {
    console.error("Error in autoSubmitResult:", error.message);
    throw error;
  }
}

module.exports = { autoSubmitResult };
