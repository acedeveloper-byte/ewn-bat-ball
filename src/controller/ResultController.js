const Result = require('../models/ResultModel');

const CreateNewResult = async (req, res) => {
  const { categoryname, date, result, number, next_result } = req.body;

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
    data: newResult
  });

};


const FetchAllResult = async (req, res) => {

  const findAllResult = await Result.find({})

  if (findAllResult.length !== 0) {

    res.status(201).json({
      message: 'Result Fetched successfully',
      data: findAllResult
    });
  } else {
    res.status(201).json({
      message: 'Error while fetching successfully',
      data: []
    });

  }

};


module.exports = { CreateNewResult, FetchAllResult };
