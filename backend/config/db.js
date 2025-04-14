const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables from .env file

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the process with failure
  }
};

module.exports = connectDB;
