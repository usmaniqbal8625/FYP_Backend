const mongoose = require("mongoose");
const statusOptions = ["pending", "accepted", "rejected"];
const { DB_Tables } = require("../utils/enum");

const laptopSchema = mongoose.Schema(
  {
    seller: {
      type: mongoose.Types.ObjectId,
      ref: DB_Tables.USER,
      // required: true,
    },
    reviewer: {
      type: mongoose.Types.ObjectId,
      ref: DB_Tables.USER,
      required: true,
    },
    laptop: { type: mongoose.Types.ObjectId, ref: DB_Tables.LAPTOP },

    rating: Number,
    comment: String,
  },
  { timestamps: true }
);

var laptopdata = mongoose.model("review", laptopSchema);
module.exports = laptopdata;
