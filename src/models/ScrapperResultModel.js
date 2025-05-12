const mongoose = require('mongoose');
const ResultSchema2 = new mongoose.Schema({
	categoryname: String,
	date: String,
	result: [{ time: String, number: String }],
	number: Number,
	next_result: String,
	createdAt: String,
	updatedAt: String,
});

// Create a Model
const Result2 = mongoose.model('ResultScrapper', ResultSchema2);

module.exports = Result2;
