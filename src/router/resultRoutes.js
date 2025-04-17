const express = require("express");
const {
  CreateNewResult,
  FetchAllResult,
  UpdateResult,
  AddKeyForResultUpdation,
  FetchAllCategories,
} = require("../controller/ResultController");
const router = express.Router();

router.post("/result", CreateNewResult);
router.get("/fetch-result", FetchAllResult);
router.put("/update-existing-result", UpdateResult);
router.post("/add-key-for-result-updation", AddKeyForResultUpdation);
router.get("/fetch-cate-result", FetchAllCategories);

module.exports = router;
