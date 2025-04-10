const express = require('express');
const { CreateNewResult } = require('../controller/ResultController');
const router = express.Router();


router.post('/result', CreateNewResult)

module.exports = router;

