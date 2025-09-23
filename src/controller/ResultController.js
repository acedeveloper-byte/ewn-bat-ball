const mongoose = require("mongoose");

const bcrypt = require("bcrypt");
const CategoryKeyModel = require("../models/KeyModel");
const redis = require("../redisClient");
const ResultsModel = require("../models/ResultModel");
const Result = require("../models/ResultModel");
const Result2 = require("../models/ScrapperResultModel");
const moment = require("moment");

const CreateNewResult = async (req, res) => {
  try {
    const { categoryname, date, number, next_result, key, time, mode } =
      req.body;

    const formattedDate = moment(date, ["DD/MM/YY", "YYYY-MM-DD"]).format(
      "YYYY-MM-DD"
    );
    const formattedTime = moment(time, ["HH:mm", "hh:mm A"]).format("hh:mm A");

    const existingDoc = await ResultsModel.findOne({ categoryname });

    if (existingDoc) {
      let dateGroupIndex = existingDoc.result.findIndex(
        (r) => r.date === formattedDate
      );

      if (dateGroupIndex !== -1) {
        const isDuplicate = existingDoc.result[dateGroupIndex].times.some(
          (entry) => entry.time === formattedTime
        );

        if (isDuplicate) {
          return res.status(200).json({
            message: "Duplicate time entry detected. No changes made.",
            data: existingDoc,
          });
        }

        existingDoc.result[dateGroupIndex].times.push({
          time: formattedTime,
          number,
        });
        existingDoc.markModified(`result.${dateGroupIndex}.times`);
      } else {
        existingDoc.result.push({
          date: formattedDate,
          times: [{ time: formattedTime, number }],
        });
        existingDoc.markModified("result");
      }

      if (next_result && existingDoc.next_result !== next_result) {
        existingDoc.next_result = next_result;
      }

      await existingDoc.save();

      // Update Redis cache after saving the new result
      const cacheKey = `results:${categoryname}:${formattedDate}`;
      await redis.set(cacheKey, existingDoc, { ex: 120 }); // Cache for 2 minutes

      return res.status(200).json({
        message: "New result added successfully",
        data: existingDoc,
      });
    } else {
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

      // Cache the newly created result
      const cacheKey = `results:${categoryname}:${formattedDate}`;
      await redis.set(cacheKey, newResult, { ex: 120 }); // Cache for 2 minutes

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
    const currentTime = moment();
    const today = currentTime.format("YYYY-MM-DD");
    const currentMonth = currentTime.month();
    const currentYear = currentTime.year();

    const cacheKey = `results:${currentYear}-${currentMonth}`;

    // 🔹 Check Redis cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log("✅ Returning data from Upstash Redis cache");
      return res.status(200).json({
        message: "Results fetched successfully (from cache)",
        data: cachedData, // 👈 Parse back to object
      });
    }

    // 🔹 Fetch from DB if cache is empty
    const latestResult = await Result.find({}).sort({ createdAt: -1 }).lean();
    const latestResult2 = await Result2.find({}).sort({ createdAt: -1 }).lean();

    const isCurrentMonth = (dateStr) => {
      const entryDate = moment(dateStr, "YYYY-MM-DD");
      return (
        entryDate.month() === currentMonth && entryDate.year() === currentYear
      );
    };

    const filteredResults = latestResult.map((doc) => {
      const filteredResult = doc.result
        .filter((entry) => isCurrentMonth(entry.date))
        .map((entry) => {
          if (entry.date === today) {
            // ✅ Sort times in descending order so the latest entry comes first
            const sortedTimes = entry.times
              .filter((t) =>
                moment(t.time, "hh:mm A").isSameOrBefore(currentTime)
              )
              .sort((a, b) =>
                moment(b.time, "hh:mm A").diff(moment(a.time, "hh:mm A"))
              );

            return { ...entry, times: sortedTimes };
          }
          return entry;
        });

      return { ...doc, result: filteredResult };
    });

    const filteredResults2 = latestResult2.map((doc) => {
      const filteredResult = doc.result
        .filter((entry) => isCurrentMonth(entry.date))
        .filter((entry) =>
          moment(entry.time, "hh:mm A").isSameOrBefore(currentTime)
        );

      return { ...doc, result: filteredResult };
    });

    const combined = [...filteredResults, ...filteredResults2];

    // 🔹 Store in Redis cache (stringify + set expiry 2 min)
    await redis.set(cacheKey, combined, { ex: 120 });

    res.status(200).json({
      message: "Results fetched successfully (current month only)",
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
  try {
    const { _id } = req.params;
    const { date, time, number, next_result } = req.body;

    // Get raw MongoDB collection (skip Mongoose schema validation)
    const collection = mongoose.connection.db.collection("results");

    const updated = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(_id) },
      {
        $set: {
          "result.$[d].times.$[t].number": number,
          next_result: next_result,
        },
      },
      {
        arrayFilters: [{ "d.date": date }, { "t.time": time }],
      }
    );

    if (updated.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "No matching date/time entry found" });
    }

    res.status(200).json({
      message: "Result updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
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

    // ✅ Define start (1st of month) and end (selected date)
    const startDate = moment([selectedYear, selectedMonth, 1]);
    const endDate = selectedMoment;

    const from = startDate.format("YYYY-MM-DD");
    const to = endDate.format("YYYY-MM-DD");

    // ✅ Create a unique cache key
    const cacheKey = `resultsByMonth:${categoryname}:${selectedDate}:${mode}`;

    // ✅ Try Redis cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log("✅ Returning data from Redis cache");
      return res.status(200).json(cachedData);
    }

    let responsePayload;

    if (mode === "scraper") {
      // ==============================
      // MODE 1: Scraper
      // ==============================
      const results2 = await Result2.find({ categoryname });

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
        .filter((doc) => doc.result.length > 0);

      responsePayload = {
        baseResponse: { message: "Results fetched successfully", status: 1 },
        from,
        to,
        data: sortedCombined,
      };
    } else {
      // ==============================
      // MODE 2: Normal DB (ResultsModel)
      // ==============================
      const allCategoryDocs = await ResultsModel.find({ categoryname });
      const currentTime = moment();

      const filteredData = allCategoryDocs
        .map((doc) => {
          const dateGroups = doc.result.filter((r) => {
            const entryDate = moment(r.date, "YYYY-MM-DD", true);
            return (
              entryDate.isSameOrAfter(startDate) &&
              entryDate.isSameOrBefore(endDate)
            );
          });

          const processedGroups = dateGroups
            .map((dateGroup) => {
              if (Array.isArray(dateGroup.times)) {
                const sortedTimes = dateGroup.times.sort((a, b) => {
                  return (
                    moment(b.time.trim(), "hh:mm A").valueOf() -
                    moment(a.time.trim(), "hh:mm A").valueOf()
                  );
                });

                const validTimes = sortedTimes.filter((t) => {
                  const entryTime = moment(t.time.trim(), "hh:mm A");
                  return entryTime.isSameOrBefore(currentTime);
                });

                if (validTimes.length > 0) {
                  return {
                    date: dateGroup.date,
                    times: validTimes,
                  };
                }
              }
              return null;
            })
            .filter((g) => g !== null);

          if (processedGroups.length > 0) {
            return {
              ...doc._doc,
              result: processedGroups,
            };
          }
          return null;
        })
        .filter((item) => item !== null);

      if (filteredData.length > 0) {
        responsePayload = {
          baseResponse: {
            message: "Filtered by current month till selected date",
            status: 1,
          },
          from,
          to,
          data: filteredData,
        };
      } else {
        responsePayload = {
          baseResponse: {
            message: "No data found in current month till selected date",
            status: 0,
          },
          from,
          to,
        };
      }
    }

    // ✅ Save response to Redis (expire in 2 min)
    await redis.set(cacheKey, responsePayload, { ex: 120 });

    return res.status(200).json(responsePayload);
  } catch (err) {
    res.status(500).json({
      baseResponse: { message: "Server error", status: 0 },
      error: err.message,
    });
  }
};

const getresultbyId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Requested ID:", id);

    // Validate ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        baseResponse: { message: "INVALID_ID", status: 0 },
        response: [],
      });
    }

    const result = await Result.findById(id); // cleaner than findOne({_id: ...})

    if (result) {
      res.status(200).json({
        baseResponse: { message: "STATUS_OK", status: 1 },
        response: result,
      });
    } else {
      res.status(404).json({
        baseResponse: { message: "NOT_FOUND", status: 0 },
        response: [],
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      baseResponse: { message: "SERVER_ERROR", status: -1 },
      response: [],
    });
  }
};

const deleteTimeEntry = async (req, res) => {
  try {
    const { id } = req.params; // document ID
    const { date, time } = req.body; // identify the entry

    const updatedDoc = await ResultsModel.findOneAndUpdate(
      { _id: id },
      {
        $pull: {
          "result.$[dateElem].times": { time },
        },
      },
      {
        new: true,
        arrayFilters: [{ "dateElem.date": date }],
      }
    );

    if (!updatedDoc) {
      return res.status(404).json({ message: "No matching entry found" });
    }

    res.json({
      message: "Time entry deleted successfully",
      updated: updatedDoc,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error deleting time entry",
      error: err.message,
    });
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
  getresultbyId,
  deleteTimeEntry,
};
