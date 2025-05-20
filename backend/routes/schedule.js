const express = require("express");
const router = express.Router();
const { generateSchedule } = require("../services/scheduler");
const Schedule = require("../models/Schedule");
const Timeslot = require("../models/Timeslot"); // Add this import at the top if not present
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

    // Get all unique days from the Timeslot collection
    let days = await Timeslot.distinct("day");

    // Sort days in the desired order
    const dayOrder = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    days = dayOrder.filter((d) => days.includes(d));

    // For each day, get sorted unique timeslots from the Timeslot collection
    const allTimeslots = await Timeslot.find({ day: { $in: days } }).lean();
    const dayTimeslots = {};
    days.forEach((day) => {
      dayTimeslots[day] = allTimeslots
        .filter((ts) => ts.day === day)
        .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
        .filter(
          (ts, idx, arr) =>
            arr.findIndex(
              (t) =>
                t.startTime === ts.startTime &&
                t.endTime === ts.endTime &&
                t.day === ts.day
            ) === idx
        );
    });

    // Build the Word document
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

              // Build a cellMap for rowSpan logic
              const cellMap = {};
              entries.forEach((entry) => {
                const slots = [...(entry.reservedTimeslots || [])].sort(
                  (a, b) => parseTime(a.startTime) - parseTime(b.startTime)
                );
                if (slots.length === 0) return;
                const day = slots[0].day;
                const firstSlotId = slots[0]._id.toString();
                cellMap[`${day}-${firstSlotId}`] = {
                  entry,
                  span: slots.length,
                };
                for (let i = 1; i < slots.length; i++) {
                  cellMap[`${day}-${slots[i]._id.toString()}`] = { skip: true };
                }
              });

              // Find the max number of timeslots in any day
              const maxRows = Math.max(
                ...days.map((day) => dayTimeslots[day].length)
              );

              // Example margin object for padding (all sides)
              const cellMargin = {
                top: 200,
                bottom: 200,
                left: 200,
                right: 200,
              };

              const numDays = days.length;
              const timeColWidth = 20; // percent
              const dayColWidth = Math.floor((100 - timeColWidth) / numDays); // percent

              // Build the table rows
              const tableRows = [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Time")],
                      margins: cellMargin,
                      width: { size: timeColWidth, type: WidthType.PERCENTAGE },
                    }),
                    ...days.map(
                      (day) =>
                        new TableCell({
                          children: [new Paragraph(day)],
                          margins: cellMargin,
                          width: {
                            size: dayColWidth,
                            type: WidthType.PERCENTAGE,
                          },
                        })
                    ),
                  ],
                }),
                ...Array.from({ length: maxRows }).map((_, rowIdx) => {
                  return new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          (() => {
                            for (const day of days) {
                              if (dayTimeslots[day][rowIdx]) {
                                const ts = dayTimeslots[day][rowIdx];
                                return new Paragraph(
                                  `${ts.startTime}-${ts.endTime}`
                                );
                              }
                            }
                            return new Paragraph("");
                          })(),
                        ],
                        margins: cellMargin,
                        width: {
                          size: timeColWidth,
                          type: WidthType.PERCENTAGE,
                        },
                      }),
                      ...days.map((day) => {
                        const ts = dayTimeslots[day][rowIdx];
                        if (!ts)
                          return new TableCell({
                            children: [new Paragraph("")],
                            margins: cellMargin,
                            width: {
                              size: dayColWidth,
                              type: WidthType.PERCENTAGE,
                            },
                          });
                        const cellKey = `${day}-${ts._id.toString()}`;
                        const cellInfo = cellMap[cellKey];
                        if (cellInfo?.skip) return null;
                        if (cellInfo?.entry) {
                          const entry = cellInfo.entry;
                          const slots = [
                            ...(entry.reservedTimeslots || []),
                          ].sort(
                            (a, b) =>
                              parseTime(a.startTime) - parseTime(b.startTime)
                          );
                          return new TableCell({
                            rowSpan: cellInfo.span,
                            children: [
                              new Paragraph(
                                `${
                                  entry.activity?.course?.courseCode || "N/A"
                                }\n${
                                  entry.activity?.lecture?.name || "N/A"
                                }\n ${entry.room?.name || "N/A"}\n ${
                                  entry.activity?.roomRequirement || "N/A"
                                }\n ${
                                  slots.length
                                    ? `${slots[0].startTime} - ${
                                        slots[slots.length - 1].endTime
                                      }`
                                    : "N/A"
                                }`
                              ),
                            ],
                            margins: cellMargin,
                            width: {
                              size: dayColWidth,
                              type: WidthType.PERCENTAGE,
                            },
                          });
                        }
                        // No activity starts here: show a black dash
                        return new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "-",
                                  color: "000000",
                                }),
                              ],
                            }),
                          ],
                          margins: cellMargin,
                          width: {
                            size: dayColWidth,
                            type: WidthType.PERCENTAGE,
                          },
                        });
                      }),
                    ].filter(Boolean), // Remove nulls (skipped cells)
                  });
                }),
              ];

              // Add visible borders to the table
              const table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: "single", size: 2, color: "000000" },
                  bottom: { style: "single", size: 2, color: "000000" },
                  left: { style: "single", size: 2, color: "000000" },
                  right: { style: "single", size: 2, color: "000000" },
                  insideHorizontal: {
                    style: "single",
                    size: 2,
                    color: "000000",
                  },
                  insideVertical: { style: "single", size: 2, color: "000000" },
                },
                rows: tableRows,
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
      "Content-Disposition": `attachment; filename=Schedule_${decodedSemester.replace(
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

module.exports = router;
