const ResultsModel = require("../models/ResultModel");
const Result = require("../models/ResultModel");

const CreateNewResult = async (req, res) => {
  const { categoryname, date, result, number, next_result } = req.body;

  const findExisting = await Result.findOne({ categoryname });
  if (findExisting) {
    res
      .status(200)
      .json({ baseResponse: { status: 0, message: "Already Exist" } });
  }
  const newResult = new Result({
    categoryname,
    date,
    result,
    number,
    next_result,
  });

  await newResult.save();

  return res.status(201).json({
    message: "Result created successfully",
    data: newResult,
  });
};

const FetchAllResult = async (req, res) => {
  try {
    const latestResult = await Result.find({}).sort({ createdAt: -1 });

    if (latestResult) {
      res.status(200).json({
        message: "Latest result fetched successfully",
        data: latestResult,
      });
    } else {
      res.status(404).json({
        message: "No results found",
        data: null,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error fetching latest result",
      error: error.message,
    });
  }
};

const UpdateResult = async (req, res) => {
  const { categoryname, time, number, next_result } = req.body;
  const findAllResult = await Result.findOne({ categoryname: categoryname });
  if (findAllResult.length !== 0) {
    const udpdate = await ResultsModel.updateOne(
      { categoryname: categoryname }, // Match by categoryname
      {
        $push: { result: { time, number } }, // Add new entry to the result array
        $set: { number, next_result }, // Update number and next_result fields
      },
      { new: true, upsert: true }
    );

    res.status(201).json({
      message: "Result Updated successfully",
      data: udpdate,
    });
  } else {
    res.status(201).json({
      message: "Error while fetching successfully",
      data: [],
    });
  }
};

module.exports = { CreateNewResult, FetchAllResult, UpdateResult };
