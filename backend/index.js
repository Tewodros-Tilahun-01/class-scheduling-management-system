const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const scheduleRoutes = require("./routes/schedule");
const dataRoutes = require("./routes/data");
const activity = require("./routes/activity");
const studentGroup = require("./routes/studentGroup");

const app = express();

// Connect to the database
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/student-groups", studentGroup);
app.use("/api/data", dataRoutes);
app.use("/api/activity", activity);
app.use("/api/schedule", scheduleRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
