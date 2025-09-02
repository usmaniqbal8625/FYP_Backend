require("dotenv").config();
const mongoose = require("mongoose");
const url = process.env.DB_URL;
const dbConnection = async () => {
  console.log("Connecting to MongoDB...", url);
  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Optional: these options help avoid deprecation warnings
    });

    console.log("✅ MongoDB connected");
  } catch (e) {
    console.error("❌ MongoDB connection failed:", e.message);
    process.exit(1); // Exit if DB fails to connect
  }
};

module.exports = { dbConnection };