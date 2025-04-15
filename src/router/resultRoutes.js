const express = require("express");
const {
  CreateNewResult,
  FetchAllResult,
  UpdateResult,
} = require("../controller/ResultController");
const router = express.Router();

router.post("/result", CreateNewResult);
router.get("/fetch-result", FetchAllResult);
router.put("/update-existing-result", UpdateResult);

module.exports = router;
