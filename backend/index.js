const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
// const courseRoutes = require("./routes/course");
// const scheduleRoutes = require("./routes/schedule");
// const activityRoutes = require("./routes/activity");
// const instructorRoutes = require("./routes/instructor");

const app = express();

// Connect to the database
connectDB();

app.use(cors());
app.use(bodyParser.json());

// // Routes
// app.use("/api/courses", courseRoutes);
// app.use("/api/schedule", scheduleRoutes);
// app.use("/api/activities", activityRoutes);
// app.use("/api/instructors", instructorRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
