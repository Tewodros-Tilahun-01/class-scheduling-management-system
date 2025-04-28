const express = require("express");
const router = express.Router();

// Mock authentication middleware (replace with real auth, e.g., JWT)
const authMiddleware = (req, res, next) => {
  req.user = {
    _id: "66f1a2b3c4d5e6f789012360",
    username: "john.doe",
    role: "scheduler",
  };
  next();
};

// Import route modules
const activityRoutes = require("./activity");
const courseRoutes = require("./course");
const instructorRoutes = require("./instructor");
const roomRoutes = require("./room");
const scheduleRoutes = require("./schedule");
const studentGroupRoutes = require("./studentGroup");
const timeslotRoutes = require("./timeslot");

// Apply auth middleware to all routes
router.use(authMiddleware);

// Mount routes
router.use("/activities", activityRoutes);
router.use("/courses", courseRoutes);
router.use("/instructors", instructorRoutes);
router.use("/rooms", roomRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/studentGroups", studentGroupRoutes);
router.use("/timeslots", timeslotRoutes);

module.exports = router;
