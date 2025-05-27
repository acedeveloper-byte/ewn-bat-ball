const CategoryKeyModel = require('../models/KeyModel');
const ResultsModel = require('../models/ResultModel');
const Result = require('../models/ResultModel');
const Result2 = require('../models/ScrapperResultModel');

const CreateNewResult = async (req, res) => {
	try {
		const { categoryname, date, result, number, next_result, key, time } =
			req.body;

		// Validate key
		const findExistingKey = await CategoryKeyModel.findOne({ key });
		if (!findExistingKey) {
			return res.status(400).json({
				message: 'Please enter a valid key',
				data: [],
			});
		}

		// Find existing document by categoryname
		const existingDoc = await ResultsModel.findOne({ categoryname });

		if (existingDoc) {
			// Check if result already has the exact same { time, number }
			const isDuplicate = existingDoc.result.some(
				(r) => r.time === time && r.number === number
			);

			if (isDuplicate) {
				// Exact entry already exists, do not update
				return res.status(200).json({
					message: 'Result already exists. No changes made.',
					data: existingDoc,
				});
			}

			// Append the new unique result entry
			existingDoc.result.push({ time, number });

			// Update next_result if provided and different
			if (next_result && existingDoc.next_result !== next_result) {
				existingDoc.next_result = next_result;
			}

			await existingDoc.save();

			return res.status(200).json({
				message: 'New result time added successfully',
				data: existingDoc,
			});
		} else {
			// No document exists, create a new one
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
				message: 'Result created successfully',
				data: newResult,
			});
		}
	} catch (error) {
		console.error('Error in CreateNewResult:', error);
		return res.status(500).json({
			message: 'Server error',
			error: error.message,
		});
	}
};

const FetchAllResult = async (req, res) => {
	try {
		// Fetch the latest results from both collections
		const latestResult = await Result.find({}).sort({ createdAt: -1 });
		const latestResult2 = await Result2.find({}).sort({ createdAt: -1 });

		// Combine both arrays
		const combinedResults = [...latestResult, ...latestResult2];

		// Sort combined array by createdAt descending
		const sortedResults = combinedResults.sort(
			(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
		);

		if (sortedResults.length > 0) {
			// Get the most recent result
			const mostRecent = sortedResults[0];

			res.status(200).json({
				message: 'Most recent result fetched successfully',
				data: mostRecent,
			});
		} else {
			res.status(404).json({
				message: 'No results found',
				data: null,
			});
		}
	} catch (error) {
		res.status(500).json({
			message: 'Error fetching latest results',
			error: error.message,
		});
	}
};

const FetchAllResultWithoutAuthcode = async (req, res) => {
	try {
		// Fetch all documents from both collections
		const latestResult = await Result.find({});
		const latestResult2 = await Result2.find({});

		// Combine both arrays
		const combinedResults = [...latestResult, ...latestResult2];

		// Sort each document's result array in ascending order by time
		combinedResults.forEach((doc) => {
			if (Array.isArray(doc.result)) {
				doc.result.sort(
					(a, b) => parseTimeToDate(a.time) - parseTimeToDate(b.time)
				);
			}
		});

		if (combinedResults.length > 0) {
			res.status(200).json({
				message:
					'Results fetched successfully with result arrays sorted by time ascending',
				data: combinedResults,
			});
		} else {
			res.status(404).json({
				message: 'No results found',
				data: null,
			});
		}
	} catch (error) {
		res.status(500).json({
			message: 'Error fetching results',
			error: error.message,
		});
	}
};

// Helper to convert "hh:mm AM/PM" to a comparable timestamp number
function parseTimeToDate(timeStr) {
	if (!timeStr) return 0;
	const now = new Date();
	const parts = timeStr.split(' ');
	let time = parts[0];
	let modifier = parts[1] || '';
	let [hours, minutes] = time.split(':').map(Number);
	if (modifier === 'PM' && hours !== 12) hours += 12;
	if (modifier === 'AM' && hours === 12) hours = 0;
	return new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		hours,
		minutes
	).getTime();
}

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
			message: 'Result Updated successfully',
			data: udpdate,
		});
	} else {
		res.status(201).json({
			message: 'Error while fetching successfully',
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
				baseResponse: { message: 'Key Added succefully', status: 1 },
				response: await NewGenetration.save(),
			});
		} else {
			res.status(200).json({
				baseResponse: {
					message: 'Category already exist please contact admin',
					status: 0,
				},
			});
		}
	} else {
		res.status(200).json({
			baseResponse: {
				message: 'Key already exist please contact admin',
				status: 0,
			},
		});
	}
};

const FetchAllCategories = async (req, res) => {
	const findAllCategory = await CategoryKeyModel.find({});

	if (findAllCategory.length !== 0) {
		res.status(200).json({
			baseResponse: { message: 'Fetch all', status: 1 },
			data: findAllCategory,
		});
	} else {
		res.status(200).json({ baseResponse: { message: 'Fetch all', status: 1 } });
	}
};

const GetResultsWithDate = async (req, res) => {
	const { date, categoryname } = req.params;

	try {
		// Fetch data from both collections with filters
		const findAllCategory = await ResultsModel.find({ date, categoryname });
		const findAllCategoryResult = await Result2.find({ date, categoryname });

		// Combine both arrays
		const combinedData = [...findAllCategory, ...findAllCategoryResult];

		// Sort combined results by createdAt descending
		const sortedData = combinedData.sort(
			(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
		);

		if (sortedData.length > 0) {
			// Get the most recent document
			const mostRecentDoc = sortedData[0];

			// Sort the result array inside the document by time descending
			const sortedResult = [...mostRecentDoc.result].sort(
				(a, b) => new Date(b.time) - new Date(a.time)
			);

			res.status(200).json({
				baseResponse: {
					message: 'Most recent result fetched successfully',
					status: 1,
				},
				data: {
					...mostRecentDoc._doc,
					result: sortedResult,
				},
			});
		} else {
			res.status(200).json({
				baseResponse: {
					message: 'No results found for given date and category',
					status: 0,
				},
				data: null,
			});
		}
	} catch (err) {
		res.status(500).json({
			baseResponse: { message: 'Server error', status: 0 },
			error: err.message,
		});
	}
};

const FetchAllCategoriesWithoutAuthcode = async (req, res) => {
	const findAllCategory = await CategoryKeyModel.find({});

	if (findAllCategory.length !== 0) {
		res.status(200).json({
			baseResponse: { message: 'Fetch all', status: 1 },
			data: findAllCategory,
		});
	} else {
		res.status(200).json({ baseResponse: { message: 'Fetch all', status: 1 } });
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

// mini no entry
// scrapper changes
//  double entry
