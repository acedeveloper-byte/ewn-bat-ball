const express = require("express");
const {
  CreateNewResult,
  FetchAllResult,
  UpdateResult,
  AddKeyForResultUpdation,
  FetchAllCategories,
  GetResultsWithDate,
} = require("../controller/ResultController");
const router = express.Router();

router.post("/result", CreateNewResult);
router.get("/fetch-result", FetchAllResult);
router.put("/update-existing-result/:_id", UpdateResult);
router.post("/add-key-for-result-updation", AddKeyForResultUpdation);
router.get("/fetch-cate-result", FetchAllCategories);
router.get("/fetch-result-by-date/:date/:categoryname", GetResultsWithDate);

module.exports = router;
