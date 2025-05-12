const express = require('express');
const {
	CreateNewResult,
	FetchAllResult,
	UpdateResult,
	AddKeyForResultUpdation,
	FetchAllCategories,
	GetResultsWithDate,
	FetchAllResultWithoutAuthcode,
	FetchAllCategoriesWithoutAuthcode,
} = require('../controller/ResultController');
const authenticate = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/result', authenticate, CreateNewResult);
router.get('/fetch-result', authenticate, FetchAllResult);
router.put('/update-existing-result/:_id', authenticate, UpdateResult);
router.post(
	'/add-key-for-result-updation',
	authenticate,
	AddKeyForResultUpdation
);
router.get('/fetch-cate-result', authenticate, FetchAllCategories);
router.get('/fetch-result-by-date/:date/:categoryname', GetResultsWithDate);
router.get('/fetch-result-direct', FetchAllResultWithoutAuthcode);
router.get('/fetch-category-direct', FetchAllCategoriesWithoutAuthcode);

module.exports = router;
