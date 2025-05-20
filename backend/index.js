const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const routes = require("./routes");
const cookieParser = require("cookie-parser");

const app = express();

// Connect to the database
connectDB();

app.use(
  cors({
    origin: "http://localhost:5173",
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
