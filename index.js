const express = require("express");
const app = express();
const serverless = require("serverless-http");
const router = require("./src/router/resultRoutes.js");
const cors = require("cors");
const loginrouter = require("./src/router/authRouter.js");
const Result2 = require("./src/models/ScrapperResultModel.js");
require("./src/config/dbconnect.js");
require("./src/scheduler.js");
// Middleware
app.use(cors());

app.use(express.json());
app.use("/api", router);
app.use("/api", loginrouter);

// Sample route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Vercel Serverless!" });
});

app.post("/api/upload-data", async (req, res) => {
  console.log(req.body);
  try {
    const { categoryname, date, time, result, number, next_result, mode } =
      req.body;

    if (!categoryname || !date || !time || !result || !number || !next_result) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Check if document with the categoryname exists
    const existingDoc = await Result2.findOne({ categoryname });

    if (!existingDoc) {
      // Create new document
      const newDoc = new Result2({
        categoryname,
        date: date,
        result: [{ time: time, number: number, date: date }], // expects: [{ time: '...', number: '...' }]
        number,
        next_result: time,
        mode,
        mode,
      });

      await newDoc.save();

      return res.status(201).json({
        message: "New category created and result added.",
        data: newDoc,
      });
    }

    // If document exists, check if this result already exists
    const incomingTime = time;
    const incomingNumber = number;

    const alreadyExists = existingDoc.result.some(
      (entry) => entry.time == incomingTime && entry.number == incomingNumber
    );

    if (alreadyExists) {
      return res.status(200).json({
        message: "Result entry already exists. No update performed.",
      });
    }

    // Push new result to existing document
    const save = await Result2.updateOne(
      { categoryname },
      {
        $push: { result: { time: time, number: number, date } },
        $set: { next_result: time, number, mode, date },
      }
    );
    console.log("save , save", save);
    return res.status(200).json({
      message: "Result added to existing category.",
      response: save,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

app.listen(5000);

module.exports = app;
