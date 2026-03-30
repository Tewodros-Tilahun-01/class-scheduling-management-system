// Import required modules and middleware
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const routes = require("./routes");
const cookieParser = require("cookie-parser");

// Initialize Express application
const app = express();

// List of origins allowed to access the server (CORS whitelist)
const allowedOrigins = [
  "http://localhost:8081",
  "http://localhost:5173",
  "http://192.168.0.124:8081",
];

// Connect to the MongoDB database
connectDB();

// Enable CORS with custom origin validation
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        // Reject requests from unauthorized origins
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies to be sent
  })
);

// Middleware to parse cookies
app.use(cookieParser());

// Middleware to parse JSON bodies in incoming requests
app.use(express.json());

// Mount all API routes under /api
app.use("/api", routes);

// Define the port number, default to 5000 if not set in environment variables
const PORT = process.env.PORT || 5000;

// Start the Express server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
