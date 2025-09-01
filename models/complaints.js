const mongoose = require("mongoose");
const statusOptions = ["pending", "accepted", "rejected"];
const { EUserRole, EstatusOptions, DB_Tables } = require("../utils/enum");

const complaintSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: DB_Tables.USER },
    description: String,
    status: {
      type: String,
      enum: EstatusOptions,
      default: EstatusOptions.PENDING,
    },
    laptopId: { type: mongoose.Types.ObjectId, ref: DB_Tables.LAPTOP },

    createdAt: Date,
  },
  { timestamps: true }
);

var laptopdata = mongoose.model("complaint", complaintSchema);
module.exports = laptopdata;
