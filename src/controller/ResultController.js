const CategoryKeyModel = require("../models/KeyModel");
const ResultsModel = require("../models/ResultModel");
const Result = require("../models/ResultModel");
const Result2 = require("../models/ScrapperResultModel");
const moment = require("moment");

const CreateNewResult = async (req, res) => {
  try {
    const { categoryname, date, number, next_result, key, time, mode } =
      req.body;

    // Format date and time
    const formattedDate = moment(date, ["DD/MM/YY", "YYYY-MM-DD"]).format(
      "YYYY-MM-DD"
    );
    const formattedTime = moment(time, ["HH:mm", "hh:mm A"]).format("hh:mm A");

    // Find existing document
    const existingDoc = await ResultsModel.findOne({
      categoryname,
    });

    if (existingDoc) {
      // Look for today's date group
      let dateGroupIndex = existingDoc.result.findIndex(
        (r) => r.date === formattedDate
      );

      if (dateGroupIndex !== -1) {
        // Check for duplicate entry
        const isDuplicate = existingDoc.result[dateGroupIndex].times.some(
          (entry) => entry.time === formattedTime && entry.number === number
        );

        if (isDuplicate) {
          return res.status(200).json({
            message: "Result already exists. No changes made.",
            data: existingDoc,
          });
        }

        // Push new result time to times array
        existingDoc.result[dateGroupIndex].times.push({
          time: formattedTime,
          number,
        });

        // Mark nested path as modified
        existingDoc.markModified(`result.${dateGroupIndex}.times`);
      } else {
        // New date group for a new day
        existingDoc.result.push({
          date: formattedDate,
          times: [{ time: formattedTime, number }],
        });

        // Mark entire result as modified since new dateGroup added
        existingDoc.markModified("result");
      }

      // Update next_result if changed
      if (next_result && existingDoc.next_result !== next_result) {
        existingDoc.next_result = next_result;
      }

      await existingDoc.save();

      return res.status(200).json({
        message: "New result added successfully",
        data: existingDoc,
      });
    } else {
      // Create a new document
      const newResult = new ResultsModel({
        categoryname,
        date: formattedDate,
        result: [
          {
            date: formattedDate,
            times: [{ time: formattedTime, number }],
          },
        ],
        number,
        next_result,
        key,
        mode,
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
    const currentTime = moment(); // current datetime
    const today = currentTime.format("YYYY-MM-DD");

    const latestResult = await Result.find({}).sort({ createdAt: -1 });
    const latestResult2 = await Result2.find({}).sort({ createdAt: -1 });

    const filteredResults = latestResult.map((doc) => {
      const filteredResult = doc.result.map((entry) => {
        if (entry.date === today) {
          const filteredTimes = entry.times.filter((t) =>
            moment(t.time, "hh:mm A").isSameOrBefore(currentTime)
          );

          return {
            ...entry,
            times: filteredTimes.sort((a, b) =>
              moment(a.time, "hh:mm A").diff(moment(b.time, "hh:mm A"))
            ),
          };
        }

        // Purani ya future date ke liye original times wapas do
        return entry;
      });

      return {
        ...doc._doc,
        result: filteredResult,
      };
    });

    const filteredResults2 = latestResult2.map((doc) => {
      // Filter only today's results and past/current times
      const filteredResult = doc.result
        .filter((entry) => entry.date === today)
        .filter((entry) =>
          moment(entry.time, "hh:mm A").isSameOrBefore(currentTime)
        )
        .sort((a, b) =>
          moment(a.time, "hh:mm A").diff(moment(b.time, "hh:mm A"))
        );

      return {
        ...doc._doc,
        result: filteredResult,
      };
    });

    const combined = [...filteredResults, ...filteredResults2];
    res.status(200).json({
      message: "Results fetched successfully",
      data: combined,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching results",
      error: error.message,
    });
  }
};

const FetchAllResultWithoutAuthcode = async (req, res) => {
  try {
    const currentTime = moment(); // current datetime
    const today = currentTime.format("YYYY-MM-DD");

    const latestResult = await Result.find({}).sort({ createdAt: -1 });
    const latestResult2 = await Result2.find({}).sort({ createdAt: -1 });

    const filteredResults = latestResult.map((doc) => {
      const filteredResult = doc.result.map((entry) => {
        if (entry.date === today) {
          const filteredTimes = entry.times.filter((t) =>
            moment(t.time, "hh:mm A").isSameOrBefore(currentTime)
          );

          return {
            ...entry,
            times: filteredTimes.sort((a, b) =>
              moment(a.time, "hh:mm A").diff(moment(b.time, "hh:mm A"))
            ),
          };
        }

        // Purani ya future date ke liye original times wapas do
        return entry;
      });

      return {
        ...doc._doc,
        result: filteredResult,
      };
    });

    const filteredResults2 = latestResult2.map((doc) => {
      // Filter only today's results and past/current times
      const filteredResult = doc.result
        .filter((entry) => entry.date === today)
        .filter((entry) =>
          moment(entry.time, "hh:mm A").isSameOrBefore(currentTime)
        )
        .sort((a, b) =>
          moment(a.time, "hh:mm A").diff(moment(b.time, "hh:mm A"))
        );

      return {
        ...doc._doc,
        result: filteredResult,
      };
    });

    const combined = [...filteredResults, ...filteredResults2];
    res.status(200).json({
      message: "Results fetched successfully",
      data: combined,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching results",
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
  const { date, categoryname, mode } = req.params;
  if (mode === "scraper") {
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
  } else {
    try {
      const { categoryname, date: inputDate } = req.body; // or req.query
      const formattedDate = moment(inputDate, [
        "DD/MM/YY",
        "YYYY-MM-DD",
      ]).format("DD/MM/YY");

      // Fetch documents by categoryname
      const allCategoryDocs = await ResultsModel.find({ categoryname });

      // Filter each document’s `result` array to only include matching date
      const filteredData = allCategoryDocs
        .map((doc) => {
          const dateGroup = doc.result.find((r) => r.date === formattedDate);
          if (dateGroup) {
            return {
              ...doc._doc,
              result: [
                // Return only this date group
                {
                  date: dateGroup.date,
                  times: [...dateGroup.times].sort((a, b) => {
                    return (
                      moment(a.time, "hh:mm A").toDate() -
                      moment(b.time, "hh:mm A").toDate()
                    );
                  }),
                },
              ],
            };
          }
          return null;
        })
        .filter((item) => item !== null); // Remove documents without matching date

      if (filteredData.length > 0) {
        res.status(200).json({
          baseResponse: { message: "Fetch all", status: 1 },
          data: filteredData,
        });
      } else {
        res.status(200).json({
          baseResponse: {
            message: "No data found for the given date",
            status: 0,
          },
        });
      }
    } catch (err) {
      res.status(500).json({
        baseResponse: { message: "Server error", status: 0 },
        error: err.message,
      });
    }
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

const FetchResultsByMonth = async (req, res) => {
  const { selectedDate, categoryname, mode } = req.params;
  if (mode === "scraper") {
    try {
      if (!selectedDate || !categoryname) {
        return res.status(400).json({
          message:
            "Invalid or missing parameters. Expected selectedDate (YYYY-MM-DD) and categoryname.",
        });
      }

      const selectedMoment = moment(selectedDate, "YYYY-MM-DD", true);
      if (!selectedMoment.isValid()) {
        return res.status(400).json({
          message: "Invalid date format. Expected format is YYYY-MM-DD.",
        });
      }

      const selectedMonth = selectedMoment.month();
      const selectedYear = selectedMoment.year();

      // Start from the 1st of the month
      const startDate = moment([selectedYear, selectedMonth, 1]);
      const endDate = selectedMoment;

      const from = startDate.format("YYYY-MM-DD");
      const to = endDate.format("YYYY-MM-DD");

      // Step 1: Find all documents in Result2 with this categoryname
      const results2 = await Result2.find({ categoryname });

      // Step 2: Filter result entries between `from` and `to`, and sort
      const sortedCombined = results2
        .map((doc) => {
          const filteredResult = doc.result.filter((entry) => {
            const entryDate = moment(entry.date, "YYYY-MM-DD", true);
            return (
              entryDate.isSameOrAfter(startDate) &&
              entryDate.isSameOrBefore(endDate)
            );
          });

          const sortedResult = filteredResult.sort((a, b) => {
            const dateDiff = moment(b.date, "YYYY-MM-DD").diff(
              moment(a.date, "YYYY-MM-DD")
            );
            if (dateDiff !== 0) return dateDiff;

            return moment(b.time.trim(), "hh:mm A").diff(
              moment(a.time.trim(), "hh:mm A")
            );
          });

          return {
            ...doc._doc,
            result: sortedResult,
          };
        })
        .filter((doc) => doc.result.length > 0); // Remove empty ones

      res.status(200).json({
        baseResponse: { message: "Results fetched successfully", status: 1 },
        from,
        to,
        data: sortedCombined,
      });
    } catch (error) {
      res.status(500).json({
        baseResponse: { message: "Server error", status: 0 },
        error: error.message,
      });
    }
  } else {
    try {
      // Fetch all documents that match the category
      const allCategoryDocs = await ResultsModel.find({ categoryname });

      // Process and filter documents
      const filteredData = allCategoryDocs
        .map((doc) => {
          const dateGroup = doc.result.find((r) => r.date === selectedDate);

          if (dateGroup && Array.isArray(dateGroup.times)) {
            // Sort the times in descending order
            const sortedTimes = dateGroup.times.sort((a, b) => {
              return (
                moment(b.time.trim(), "hh:mm A").valueOf() -
                moment(a.time.trim(), "hh:mm A").valueOf()
              );
            });

            // Optional debug
            console.log(
              "Sorted Times:",
              sortedTimes.map((t) => t.time)
            );

            return {
              ...doc._doc,
              result: [
                {
                  date: dateGroup.date,
                  times: sortedTimes,
                },
              ],
            };
          }

          return null;
        })
        .filter((item) => item !== null);

      // Return response
      if (filteredData.length > 0) {
        res.status(200).json({
          baseResponse: { message: "Fetch all", status: 1 },
          data: filteredData,
        });
      } else {
        res.status(200).json({
          baseResponse: {
            message: "No data found for the given date",
            status: 0,
          },
        });
      }
    } catch (err) {
      res.status(500).json({
        baseResponse: { message: "Server error", status: 0 },
        error: err.message,
      });
    }
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
  FetchResultsByMonth,
};
