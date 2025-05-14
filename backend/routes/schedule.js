const express = require("express");
const router = express.Router();
const { generateSchedule } = require("../services/scheduler");
const Schedule = require("../models/Schedule");
const mongoose = require("mongoose");
require("../models/User");

// POST /api/schedules/generate - Generate a single schedule for the semester
router.post("/generate", async (req, res) => {
  try {
    const { semester } = req.body;
    if (!semester) {
      return res.status(400).json({ error: "Semester is required" });
    }
    if (!req.user?._id || !mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res.status(401).json({ error: "Valid user ID is required" });
    }

    const schedules = await generateSchedule(semester, req.user._id.toString());
    if (!schedules || Object.keys(schedules).length === 0) {
      return res.status(404).json({
        error:
          "No schedules generated. Ensure activities exist for the semester.",
      });
    }
    res.json(schedules);
  } catch (err) {
    console.error("Error generating schedule:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to generate schedule" });
  }
});

// GET /api/semesters - Retrieve all unique semesters
router.get("/semesters", async (req, res) => {
  try {
    const semesters = await Schedule.distinct("semester");
    if (semesters.length === 0) {
      return res.json({ error: "No semesters found" });
    }
    res.json(semesters);
  } catch (err) {
    console.error("Error fetching semesters:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/schedules - Retrieve all schedules, optionally grouped or filtered by semester and ownership
router.get("/", async (req, res) => {
  try {
    const { groupByStudentGroup, semester, own } = req.query;
    const query = {};
    if (semester) {
      query.semester = semester;
    }
    if (own === "true") {
      if (!req.user?._id || !mongoose.Types.ObjectId.isValid(req.user._id)) {
        return res.status(401).json({ error: "Valid user ID is required" });
      }
      query.createdBy = req.user._id;
    }

    const schedules = await Schedule.find(query)
      .populate({
        path: "activity",
        populate: [
          { path: "course", select: "courseCode name" },
          { path: "lecture", select: "name maxLoad" },
          {
            path: "studentGroup",
            select: "department year section expectedEnrollment",
          },
          { path: "createdBy", select: "username name" },
        ],
      })
      .populate("room", "name capacity type department")
      .populate("timeslot", "day startTime endTime preferenceScore")
      .populate("studentGroup", "department year section expectedEnrollment")
      .populate("createdBy", "username name")
      .lean();

    if (groupByStudentGroup === "true") {
      const groupedSchedules = schedules.reduce((acc, entry) => {
        const groupId = entry.studentGroup?._id?.toString() || "unknown";
        if (!acc[groupId]) {
          acc[groupId] = {
            studentGroup: entry.studentGroup || {
              department: "Unknown",
              year: 0,
              section: "N/A",
              expectedEnrollment: 0,
            },
            entries: [],
          };
        }
        acc[groupId].entries.push(entry);
        return acc;
      }, {});
      res.json(groupedSchedules);
    } else {
      res.json(schedules);
    }
  } catch (err) {
    console.error("Error fetching schedules:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/schedules/:semester - Retrieve schedules for a specific semester
router.get("/:semester", async (req, res) => {
  try {
    const { semester } = req.params;
    const { own } = req.query;
    const query = { semester: decodeURIComponent(semester) };
    if (own === "true") {
      if (!req.user?._id || !mongoose.Types.ObjectId.isValid(req.user._id)) {
        return res.status(401).json({ error: "Valid user ID is required" });
      }
      query.createdBy = req.user._id;
    }

    const schedules = await Schedule.find(query)
      .populate({
        path: "activity",
        populate: [
          { path: "course", select: "courseCode name" },
          { path: "lecture", select: "name maxLoad" },
          {
            path: "studentGroup",
            select: "department year section expectedEnrollment",
          },
          { path: "createdBy", select: "username name" },
        ],
      })
      .populate("room", "name capacity type department")
      .populate("timeslot", "day startTime endTime preferenceScore")
      .populate("studentGroup", "department year section expectedEnrollment")
      .populate("createdBy", "username name")
      .lean();

    if (schedules.length === 0) {
      return res
        .status(404)
        .json({ error: `No schedules found for semester: ${semester}` });
    }

    const groupedSchedules = schedules.reduce((acc, entry) => {
      const groupId = entry.studentGroup?._id?.toString() || "unknown";
      if (!acc[groupId]) {
        acc[groupId] = {
          studentGroup: entry.studentGroup || {
            department: "Unknown",
            year: 0,
            section: "N/A",
            expectedEnrollment: 0,
          },
          entries: [],
        };
      }
      acc[groupId].entries.push(entry);
      return acc;
    }, {});

    res.json(groupedSchedules);
  } catch (err) {
    console.error("Error fetching schedules for semester:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/schedules/group/:studentGroupId - Retrieve schedule for a specific student group
router.get("/group/:studentGroupId", async (req, res) => {
  try {
    const { studentGroupId } = req.params;
    const { semester, own } = req.query;
    if (!mongoose.Types.ObjectId.isValid(studentGroupId)) {
      return res.status(400).json({ error: "Invalid studentGroupId" });
    }

    const query = { studentGroup: studentGroupId };
    if (semester) {
      query.semester = semester;
    }
    if (own === "true") {
      if (!req.user?._id || !mongoose.Types.ObjectId.isValid(req.user._id)) {
        return res.status(401).json({ error: "Valid user ID is required" });
      }
      query.createdBy = req.user._id;
    }

    const schedules = await Schedule.find(query)
      .populate({
        path: "activity",
        populate: [
          { path: "course", select: "courseCode name" },
          { path: "lecture", select: "name maxLoad" },
          {
            path: "studentGroup",
            select: "department year section expectedEnrollment",
          },
          { path: "createdBy", select: "username name" },
        ],
      })
      .populate("room", "name capacity type department")
      .populate("timeslot", "day startTime endTime preferenceScore")
      .populate("studentGroup", "department year section expectedEnrollment")
      .populate("createdBy", "username name")
      .lean();

    if (schedules.length === 0) {
      return res
        .status(404)
        .json({ error: "No schedule found for this student group" });
    }

    const studentGroup = schedules[0].studentGroup || {
      department: "Unknown",
      year: 0,
      section: "N/A",
      expectedEnrollment: 0,
    };
    res.json({
      studentGroup,
      entries: schedules,
    });
  } catch (err) {
    console.error("Error fetching schedule for student group:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/schedules/:id - Hard delete a schedule
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid schedule ID" });
    }

    const schedule = await Schedule.findByIdAndDelete(id);

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json({ message: "Schedule deleted successfully" });
  } catch (err) {
    console.error("Error deleting schedule:", err);
    res.status(500).json({ error: err.message || "Failed to delete schedule" });
  }
});

module.exports = router;

const {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TextRun,
} = require("docx");

// Existing routes (e.g., POST /generate) go here

// GET /schedules/:semester/export - Export schedule as DOCX
router.get("/:semester/export", async (req, res) => {
  try {
    const { semester } = req.params;
    const decodedSemester = decodeURIComponent(semester);

    // Fetch schedules with populated data
    const schedules = await Schedule.find({ semester: decodedSemester })
      .populate({
        path: "activity",
        populate: [
          { path: "course", select: "courseCode name" },
          { path: "lecture", select: "name" },
          { path: "studentGroup", select: "department year section" },
        ],
      })
      .populate("room", "name")
      .populate("timeslot", "day startTime endTime")
      .populate("studentGroup", "department year section")
      .lean();

    if (!schedules.length) {
      return res
        .status(404)
        .json({ error: `No schedules found for ${decodedSemester}` });
    }

    // Group schedules by student group
    const groupedSchedules = schedules.reduce((acc, entry) => {
      const groupId = entry.studentGroup?._id?.toString() || "unknown";
      if (!acc[groupId]) {
        acc[groupId] = {
          studentGroup: entry.studentGroup || {
            department: "Unknown",
            year: 0,
            section: "N/A",
          },
          entries: [],
        };
      }
      acc[groupId].entries.push(entry);
      return acc;
    }, {});

    // Define days and fetch unique timeslots
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const timeslots = [
      ...new Set(
        schedules
          .filter((s) => s.timeslot && s.timeslot.day === days[0])
          .map((s) => `${s.timeslot.startTime}-${s.timeslot.endTime}`)
          .sort((a, b) => {
            const [startA] = a.split("-").map((t) => {
              const [h, m] = t.split(":").map(Number);
              return h * 60 + m;
            });
            const [startB] = b.split("-").map((t) => {
              const [h, m] = t.split(":").map(Number);
              return h * 60 + m;
            });
            return startA - startB;
          })
      ),
    ];

    // Create DOCX document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Schedule for ${decodedSemester}`,
                  bold: true,
                  size: 28,
                }),
              ],
              spacing: { after: 400 },
            }),
            ...Object.values(groupedSchedules).flatMap((group) => {
              const { studentGroup, entries } = group;
              const title = new Paragraph({
                children: [
                  new TextRun({
                    text: `Timetable for ${studentGroup.department} Year ${studentGroup.year} Section ${studentGroup.section}`,
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              });

              // Create table
              const table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  // Header row
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph("Time")],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                      ...days.map(
                        (day) =>
                          new TableCell({
                            children: [new Paragraph(day)],
                            width: { size: 14.16, type: WidthType.PERCENTAGE },
                          })
                      ),
                    ],
                  }),
                  // Data rows
                  ...timeslots.map((timeslot) => {
                    const row = new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph(timeslot)],
                        }),
                        ...days.map((day) => {
                          const activities = entries.filter((entry) => {
                            if (!entry.timeslot) return false;
                            return (
                              entry.timeslot.day === day &&
                              `${entry.timeslot.startTime}-${entry.timeslot.endTime}` ===
                                timeslot
                            );
                          });
                          const cellContent =
                            activities.length > 0
                              ? activities
                                  .map(
                                    (a) =>
                                      `${
                                        a.activity?.course?.courseCode || "N/A"
                                      } - ${
                                        a.activity?.course?.name || "N/A"
                                      }\nLecture: ${
                                        a.activity?.lecture?.name || "N/A"
                                      }\nRoom: ${a.room?.name || "N/A"}`
                                  )
                                  .join("\n\n")
                              : "-";
                          return new TableCell({
                            children: [new Paragraph(cellContent)],
                          });
                        }),
                      ],
                    });
                    return row;
                  }),
                ],
              });

              return [title, table, new Paragraph({ spacing: { after: 400 } })];
            }),
          ],
        },
      ],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Set headers for file download
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename=Schedule_${decodedSemester.replace(
        /\s/g,
        "_"
      )}.docx`,
      "Content-Length": buffer.length,
    });

    // Send the file
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting schedule:", error);
    res
      .status(500)
      .json({ error: `Failed to export schedule: ${error.message}` });
  }
});

module.exports = router;
