const CategoryKeyModel = require("../models/KeyModel");
const ResultsModel = require("../models/ResultModel");
const Result = require("../models/ResultModel");
const Result2 = require("../models/ScrapperResultModel");

const CreateNewResult = async (req, res) => {
  try {
    const { categoryname, date, result, number, next_result, key, time } =
      req.body;

    // Validate key
    const findExistingKey = await CategoryKeyModel.findOne({ key });
    if (!findExistingKey) {
      return res.status(400).json({
        message: "Please enter a valid key",
        data: [],
      });
    }

    // Check if the result with the same categoryname and time already exists
    const findExistingCat = await ResultsModel.findOne({
      categoryname,
      result: { $elemMatch: { time } },
    });

    if (findExistingCat) {
      // Duplicate time exists for this category, update it with new number
      const update = await ResultsModel.updateOne(
        { categoryname },
        {
          $push: { result: { time, number } },
          $set: { next_result },
        },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        message: "Result updated successfully",
        data: update,
      });
    } else {
      // No duplicate, create a new result
      const newResult = new ResultsModel({
        categoryname,
        date,
        result: [{ time, number }],
        number,
        next_result,
        key,
      });

      await newResult.save();

      return res.status(201).json({
        message: "Result created successfully",
        data: newResult,
      });
    }
  } catch (error) {
    console.error("Error in CreateNewResult:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const FetchAllResult = async (req, res) => {
  try {
    // Fetch the latest results from both collections
    const latestResult = await Result.find({}).sort({ createdAt: -1 });
    const latestResult2 = await Result2.find({}).sort({ createdAt: -1 });

    // Combine both arrays into a single array
    const combinedResults = [...latestResult, ...latestResult2];

    // Check if there are results
    if (combinedResults.length > 0) {
      res.status(200).json({
        message: "Latest results fetched successfully",
        data: combinedResults,
      });
    } else {
      res.status(404).json({
        message: "No results found",
        data: null,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error fetching latest results",
      error: error.message,
    });
  }
};

const FetchAllResultWithoutAuthcode = async (req, res) => {
  try {
    // Fetch the latest results from both collections
    const latestResult = await Result.find({}).sort({ createdAt: -1 });
    const latestResult2 = await Result2.find({}).sort({ createdAt: -1 });

    // Combine both arrays into a single array
    const combinedResults = [...latestResult, ...latestResult2];

    // Check if there are results
    if (combinedResults.length > 0) {
      res.status(200).json({
        message: "Latest results fetched successfully",
        data: combinedResults,
      });
    } else {
      res.status(404).json({
        message: "No results found",
        data: null,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error fetching latest results",
      error: error.message,
    });
  }
};

const UpdateResult = async (req, res) => {
  const { _id } = req.params;
  const { categoryname, time, number, next_result } = req.body;
  const findAllResult = await Result.findOne({ _id: _id });
  if (findAllResult.length !== 0) {
    const udpdate = await ResultsModel.updateOne(
      { _id: _id }, // Match by categoryname
      {
        $push: { result: { time, number } }, // Add new 	entry to the result array
        $set: { next_result }, // Update number and next_result fields
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

const AddKeyForResultUpdation = async (req, res) => {
  const { key, categoryname } = req.body;

  const findOne = await CategoryKeyModel.findOne({ key: key });
  console.log(findOne);

  if (findOne === null) {
    const findOneName = await CategoryKeyModel.findOne({
      categoryname: categoryname,
    });
    if (findOneName === null) {
      const NewGenetration = new CategoryKeyModel({ key, categoryname });
      res.status(200).json({
        baseResponse: { message: "Key Added succefully", status: 1 },
        response: await NewGenetration.save(),
      });
    } else {
      res.status(200).json({
        baseResponse: {
          message: "Category already exist please contact admin",
          status: 0,
        },
      });
    }
  } else {
    res.status(200).json({
      baseResponse: {
        message: "Key already exist please contact admin",
        status: 0,
      },
    });
  }
};

const FetchAllCategories = async (req, res) => {
  const findAllCategory = await CategoryKeyModel.find({});

  if (findAllCategory.length !== 0) {
    res.status(200).json({
      baseResponse: { message: "Fetch all", status: 1 },
      data: findAllCategory,
    });
  } else {
    res.status(200).json({ baseResponse: { message: "Fetch all", status: 1 } });
  }
};

const GetResultsWithDate = async (req, res) => {
  const { date, categoryname } = req.params;

  try {
    // Fetch data from both collections
    const findAllCategory = await ResultsModel.find({ date, categoryname });
    const findAllCategoryResult = await Result2.find({ date, categoryname });

    // Combine both arrays
    const combinedData = [...findAllCategory, ...findAllCategoryResult];

    // If there's data, sort the combined results by time
    if (combinedData.length !== 0) {
      const sortedData = combinedData.map((doc) => {
        // Sort each 'result' array inside each document
        const sortedResult = [...doc.result].sort(
          (a, b) => new Date(b.time) - new Date(a.time)
        );
        return {
          ...doc._doc,
          result: sortedResult,
        };
      });

      res.status(200).json({
        baseResponse: { message: "Fetch all", status: 1 },
        data: sortedData,
      });
    } else {
      res.status(200).json({
        baseResponse: { message: "Not able to fetch", status: 0 },
      });
    }
  } catch (err) {
    res.status(500).json({
      baseResponse: { message: "Server error", status: 0 },
      error: err.message,
    });
  }
};

const FetchAllCategoriesWithoutAuthcode = async (req, res) => {
  const findAllCategory = await CategoryKeyModel.find({});

  if (findAllCategory.length !== 0) {
    res.status(200).json({
      baseResponse: { message: "Fetch all", status: 1 },
      data: findAllCategory,
    });
  } else {
    res.status(200).json({ baseResponse: { message: "Fetch all", status: 1 } });
  }
};

module.exports = {
  CreateNewResult,
  FetchAllResult,
  UpdateResult,
  AddKeyForResultUpdation,
  FetchAllCategories,
  GetResultsWithDate,
  FetchAllCategoriesWithoutAuthcode,
  FetchAllResultWithoutAuthcode,
};
