const mongoose = require("mongoose");
const { EUserRole, EstatusOptions, DB_Tables } = require("../utils/enum");

const laptopSchema = mongoose.Schema(
  {
    title: String,
    brand: String,
    model: String,
    price: Number,
    condition: String,
    description: String,
    specifications: {
      processor: String,
      ram: String,
      storage: String,
      display: String,
      gpu: String,
      batteryLife: String,
      os: String,
    },
    images: [String],
    ownerId: { type: mongoose.Types.ObjectId, ref: DB_Tables.USER },
    status: {
      type: String,
      enum: EstatusOptions,
      default: EstatusOptions.PENDING,
    },
    isAvailable: { type: Boolean, default: false },
    count: { type: Number, default: 0 },
    isblock: { type: Boolean, default: false },
  },
  { timestamps: true }
);

var laptopdata = mongoose.model("laptop", laptopSchema);
module.exports = laptopdata;
