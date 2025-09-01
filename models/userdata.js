const mongoose = require("mongoose");
const statusOptions = ["pending", "accepted", "rejected"];
const { EUserRole, EstatusOptions } = require("../utils/enum");

const userSchema = mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
      unique: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNo: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    poBoxNumber: { type: String },

    isActive: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: EstatusOptions,
      default: EstatusOptions.PENDING,
    },
    role: {
      type: String,
      default: EUserRole.USER,
      enum: EUserRole,
    },
    warningCount: {
      type: Number,
      default: 0,
    },
    emailVerified: { type: Boolean, default: true },
    profile: { type: String, required: false },
    isblock: { type: Boolean, default: false },
    resendCount: { type: Number, default: 0 },
    lastResendAttempt: { type: Number, default: 0 },
  },

  { timestamps: true }
);

var userdata = mongoose.model("user", userSchema);
module.exports = userdata;
