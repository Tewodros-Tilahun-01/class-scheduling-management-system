const express = require("express");
const router = express.Router();

// Import route modules
const courseRoutes = require("./course");
const lectureRoutes = require("./lecture");
const roomRoutes = require("./room");
const studentGroupRoutes = require("./studentGroup");
const timeslotRoutes = require("./timeslot");
const activityRoutes = require("./activity");
const scheduleRoutes = require("./schedule");
const authRoutes = require("./auth");
const userRoutes = require("./user");
const adminRoutes = require("./admin");


// Mount routes
router.use("/activities", activityRoutes);
router.use("/courses", courseRoutes);
router.use("/lectures", lectureRoutes);
router.use("/rooms", roomRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/studentGroups", studentGroupRoutes);
router.use("/timeslots", timeslotRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);

module.exports = router;
