const mongoose = require("mongoose");
const { DB_Tables, EstatusOptions } = require("../utils/enum");

const purchaseSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: DB_Tables.USER,
      required: true,
    },
    laptops: [
      {
        laptop: {
          type: mongoose.Types.ObjectId,
          ref: DB_Tables.LAPTOP,
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    finalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: EstatusOptions,
      default: EstatusOptions.PENDING,
    },
  },
  { timestamps: true }
);

const purchasedata = mongoose.model("purchase", purchaseSchema);
module.exports = purchasedata;
