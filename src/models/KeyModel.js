const mongoose = require("mongoose");

const categoryKeychema = new mongoose.Schema(
  {
    categoryname: { type: String, required: true },
    key: { type: String, required: true },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields automatically
  }
);

const CategoryKeyModel = mongoose.model("CategoryKeys", categoryKeychema);

module.exports = CategoryKeyModel;
