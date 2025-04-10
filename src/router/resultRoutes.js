const express = require('express');
const { CreateNewResult, FetchAllResult } = require('../controller/ResultController');
const router = express.Router();


router.post('/result', CreateNewResult)
router.get('/fetch-result', FetchAllResult)

module.exports = router;

