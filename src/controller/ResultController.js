const Result = require('../models/ResultModel');

const CreateNewResult = async (req, res) => {
//   try {
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

//   } catch (error) {
//     res.status(500).json({
//       message: error,
//       error
//     });
//   }
};

module.exports = { CreateNewResult };
