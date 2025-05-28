const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const routes = require("./routes");
const cookieParser = require("cookie-parser");
const app = express();

// Connect to the database
connectDB();

const allowedOrigins = [
  "http://localhost:8081",
  "http://localhost:5173",
  "http://192.168.0.124:8081",
];
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Mount routes
app.use("/api", routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
