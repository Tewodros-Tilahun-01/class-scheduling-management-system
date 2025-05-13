const { Router } = require("express");
const courseRoutes = require("./course");
const instructorRoutes = require("./instructor");
const roomRoutes = require("./room");
const studentGroupRoutes = require("./studentGroup");
const timeslotRoutes = require("./timeslot");
const activityRoutes = require("./activity");
const scheduleRoutes = require("./schedule");
const authRoutes = require("./auth");
const userRoutes = require("./user");
const adminRoutes = require("./admin");
const router = Router();

const authMiddleware = (req, res, next) => {
  req.user = {
    _id: "66f1a2b3c4d5e6f789012360",
    username: "john.doe",
    role: "scheduler",
  };
  next();
};

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
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);

module.exports = router;
