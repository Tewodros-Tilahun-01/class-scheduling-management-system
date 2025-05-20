const express = require("express");
const router = express.Router();
const { generateSchedule } = require("../services/scheduler");
const Schedule = require("../models/Schedule");
const mongoose = require("mongoose");
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

router.get("/", async (req, res) => {
  try {
    const { groupByStudentGroup, semester, own } = req.query;
    const query = {};
    if (semester) query.semester = semester;
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
      .populate("reservedTimeslots", "day startTime endTime duration")
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
      .populate("reservedTimeslots", "day startTime endTime duration")
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

router.get("/group/:studentGroupId", async (req, res) => {
  try {
    const { studentGroupId } = req.params;
    const { semester, own } = req.query;
    if (!mongoose.Types.ObjectId.isValid(studentGroupId)) {
      return res.status(400).json({ error: "Invalid studentGroupId" });
    }

    const query = { studentGroup: studentGroupId };
    if (semester) query.semester = semester;
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
      .populate("reservedTimeslots", "day startTime endTime duration")
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

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid schedule ID" });
    }

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    await mongoose
      .model("Timeslot")
      .updateMany(
        { _id: { $in: schedule.reservedTimeslots } },
        { isReserved: false }
      );

    await Schedule.findByIdAndDelete(id);
    res.json({ message: "Schedule deleted successfully" });
  } catch (err) {
    console.error("Error deleting schedule:", err);
    res.status(500).json({ error: err.message || "Failed to delete schedule" });
  }
});

router.get("/:semester/export", async (req, res) => {
  try {
    const { semester } = req.params;
    const decodedSemester = decodeURIComponent(semester);

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
      .populate("reservedTimeslots", "day startTime endTime duration")
      .lean();

    if (!schedules.length) {
      return res
        .status(404)
        .json({ error: `No schedules found for ${decodedSemester}` });
    }

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
          .map((s) => {
            const start = parseTime(s.timeslot.startTime);
            const end = start + s.totalDuration;
            return `${s.timeslot.startTime}-${formatTime(end)}`;
          })
          .sort(
            (a, b) => parseTime(a.split("-")[0]) - parseTime(b.split("-")[0])
          )
      ),
    ];

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

              const table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
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
                  ...timeslots.map((timeslot) => {
                    const row = new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph(timeslot)],
                        }),
                        ...days.map((day) => {
                          const activities = entries.filter((entry) => {
                            if (!entry.timeslot) return false;
                            const start = parseTime(entry.timeslot.startTime);
                            const end = start + entry.totalDuration;
                            const slotStart = parseTime(timeslot.split("-")[0]);
                            const slotEnd = parseTime(timeslot.split("-")[1]);
                            return (
                              entry.timeslot.day === day &&
                              start < slotEnd &&
                              end > slotStart
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

    const buffer = await Packer.toBuffer(doc);
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; Wfilename=Schedule_${decodedSemester.replace(
        /\s/g,
        "_"
      )}.docx`,
      "Content-Length": buffer.length,
    });
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting schedule:", error);
    res
      .status(500)
      .json({ error: `Failed to export schedule: ${error.message}` });
  }
});

function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

module.exports = router;
