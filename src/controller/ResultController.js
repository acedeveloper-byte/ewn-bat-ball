const CategoryKeyModel = require('../models/KeyModel');
const ResultsModel = require('../models/ResultModel');
const Result = require('../models/ResultModel');

const CreateNewResult = async (req, res) => {
	const { categoryname, date, result, number, next_result, key } = req.body;

	const findExisting = await CategoryKeyModel.findOne({ key });

	if (findExisting === null) {
		res.status(200).json({
			baseResponse: {
				status: 0,
				message: 'Please enter a valid key as this is invalid',
			},
		});
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
		message: 'Result created successfully',
		data: newResult,
	});
};

const FetchAllResult = async (req, res) => {
	try {
		const latestResult = await Result.find({}).sort({ createdAt: -1 });

		if (latestResult) {
			res.status(200).json({
				message: 'Latest result fetched successfully',
				data: latestResult,
			});
		} else {
			res.status(404).json({
				message: 'No results found',
				data: null,
			});
		}
	} catch (error) {
		res.status(500).json({
			message: 'Error fetching latest result',
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
				$push: { result: { time, number } }, // Add new entry to the result array
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
	const findAllCategory = await ResultsModel.find({
		date: date,
		categoryname: categoryname,
	});

	console.log(findAllCategory.length);

	if (findAllCategory.length !== 0) {
		res.status(200).json({
			baseResponse: { message: 'Fetch all', status: 1 },
			data: findAllCategory,
		});
	} else {
		res
			.status(200)
			.json({ baseResponse: { message: 'Not able to fetch', status: 0 } });
	}
};

module.exports = {
	CreateNewResult,
	FetchAllResult,
	UpdateResult,
	AddKeyForResultUpdation,
	FetchAllCategories,
	GetResultsWithDate,
};
