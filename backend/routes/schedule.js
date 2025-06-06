const express = require("express");
const router = express.Router();
const {
  generateSchedule,
  regenerateSchedule,
  checkWorkerStatus,
} = require("../services/scheduler");
const Schedule = require("../models/Schedule");
const Timeslot = require("../models/Timeslot");
const Lecture = require("../models/Lectures");
const Activity = require("../models/Activity");
require("../models/User");
require("../models/Course");
require("../models/StudentGroup");

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

    if (!req.user?.id || !mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(401).json({ error: "Valid user ID is required" });
    }

    const { workerId } = await generateSchedule(
      semester,
      req.user.id.toString()
    );
    res.json({ workerId });
  } catch (err) {
    console.error("Error starting schedule generation:", err);
    res.status(500).json({ error: err.message });
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
      if (!req.user?.id || !mongoose.Types.ObjectId.isValid(req.user.id)) {
        return res.status(401).json({ error: "Valid user ID is required" });
      }
      query.createdBy = req.user.id;
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
      if (!req.user?.id || !mongoose.Types.ObjectId.isValid(req.user.id)) {
        return res.status(401).json({ error: "Valid user ID is required" });
      }
      query.createdBy = req.user.id;
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
    const { semester } = req.query;

    if (!mongoose.Types.ObjectId.isValid(studentGroupId)) {
      return res.status(400).json({ error: "Invalid studentGroupId" });
    }

    const query = {
      studentGroup: studentGroupId,
    };
    if (semester) query.semester = semester;

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
      const groupId =
        entry.activity?.studentGroup?._id?.toString() || "unknown";
      if (!acc[groupId]) {
        acc[groupId] = {
          studentGroup: entry.activity?.studentGroup || {
            department: entry.activity?.studentGroup?.department || "Unknown",
            year: entry.activity?.studentGroup?.year || 0,
            section: entry.activity?.studentGroup?.section || "N/A",
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
            ...Object.values(groupedSchedules)
              .map((group, idx) => {
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
                    cellMap[`${day}-${slots[i]._id.toString()}`] = {
                      skip: true,
                    };
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
                  left: 170,
                  right: 170,
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
                        width: {
                          size: timeColWidth,
                          type: WidthType.PERCENTAGE,
                        },
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
                                  }\n${entry.room?.name || "N/A"}\n ${
                                    entry.activity?.roomRequirement || "N/A"
                                  }\n ${
                                    slots.length
                                      ? `${slots[0].startTime} - ${
                                          slots[slots.length - 1].endTime
                                        }`
                                      : "N/A"
                                  }\n${
                                    entry.activity?.roomRequirement || "N/A"
                                  }\n `
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
                    insideVertical: {
                      style: "single",
                      size: 2,
                      color: "000000",
                    },
                  },
                  rows: tableRows,
                });

                const pageBreak =
                  idx > 0 ? [new Paragraph({ pageBreakBefore: true })] : [];

                return [
                  ...pageBreak,
                  title,
                  table,
                  new Paragraph({ spacing: { after: 400 } }),
                ];
              })
              .flat(),
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

router.post("/regenerateSchedule", async (req, res) => {
  try {
    const { semester, activityIds } = req.body;

    if (!semester || !Array.isArray(activityIds) || activityIds.length === 0) {
      return res.status(400).json({
        error: "Semester and non-empty array of activity IDs are required",
      });
    }

    // Validate that all activityIds are valid MongoDB ObjectIds
    const invalidIds = activityIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res.status(400).json({
        error: `Invalid activity IDs: ${invalidIds.join(", ")}`,
      });
    }

    if (!req.user?.id || !mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(401).json({ error: "Valid user ID is required" });
    }

    const schedules = await regenerateSchedule(
      semester,
      activityIds,
      req.user.id.toString()
    );

    if (!schedules || Object.keys(schedules).length === 0) {
      return res.status(404).json({
        error:
          "No schedules generated. Ensure activities exist and are valid for rescheduling.",
      });
    }

    res.json(schedules);
  } catch (err) {
    console.error("Error rescheduling activities:", err);
    res.status(500).json({
      error: err.message || "Failed to reschedule activities",
    });
  }
});

//  for free rooms
router.get("/:semester/free-rooms", async (req, res) => {
  try {
    const { semester } = req.params;
    const { day, timeslot } = req.query;

    // Get all rooms
    const rooms = await mongoose.model("Room").find().lean();

    // Get occupied rooms for the given day and timeslot
    const occupiedRooms = await Schedule.find({
      semester: decodeURIComponent(semester),
      reservedTimeslots: timeslot,
    }).distinct("room");

    // Filter out occupied rooms
    const freeRooms = rooms.filter(
      (room) => !occupiedRooms.includes(room._id.toString())
    );

    res.json(freeRooms);
  } catch (err) {
    console.error("Error fetching free rooms:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add endpoint for all lectures' schedules
router.get("/:semester/lectures/all", async (req, res) => {
  try {
    const { semester } = req.params;

    const schedules = await Schedule.find({
      semester: decodeURIComponent(semester),
    })
      .populate({
        path: "activity",
        populate: [
          { path: "course", select: "courseCode name" },
          { path: "lecture", select: "name maxLoad isDeleted" },
          { path: "studentGroup", select: "department year section" },
        ],
      })
      .populate("room", "name capacity type department")
      .populate("reservedTimeslots", "day startTime endTime duration")
      .lean();

    if (schedules.length === 0) {
      return res.status(404).json({
        error: `No schedules found for semester: ${semester}`,
      });
    }

    // Group schedules by lecture
    const lectureSchedules = schedules.reduce((acc, schedule) => {
      const lectureId = schedule.activity?.lecture?._id?.toString();
      const lecture = schedule.activity?.lecture;
      if (lectureId && lecture && !lecture.isDeleted) {
        if (!acc[lectureId]) {
          acc[lectureId] = {
            name: lecture.name,
            maxLoad: lecture.maxLoad,
            schedules: [],
          };
        }
        acc[lectureId].schedules.push(schedule);
      }
      return acc;
    }, {});

    res.json(lectureSchedules);
  } catch (err) {
    console.error("Error fetching all lecture schedules:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:semester/lecture/:lectureId/export", async (req, res) => {
  try {
    const { semester, lectureId } = req.params;
    if (!semester || !lectureId) {
      return res
        .status(400)
        .json({ error: "Semester and lecture ID are required" });
    }

    const decodedSemester = decodeURIComponent(semester);

    const activities = await Activity.find({
      lecture: lectureId,
      semester: decodedSemester,
    }).select("_id");

    const activityIds = activities.map((activity) => activity._id);

    const schedules = await Schedule.find({
      semester: decodedSemester,
      activity: { $in: activityIds },
    })
      .populate({
        path: "activity",
        populate: [
          { path: "course", select: "courseCode name" },
          { path: "lecture", select: "name maxLoad isDeleted" },
          { path: "studentGroup", select: "department year section" },
        ],
      })
      .populate("room", "name")
      .populate("reservedTimeslots", "day startTime endTime duration")
      .lean();

    if (!schedules.length) {
      return res.status(404).json({
        error: `No schedules found for lecture in ${decodedSemester}`,
      });
    }

    // Sort schedules by day and time
    const dayOrder = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };

    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const getEarliestTime = (schedule) => {
      if (
        !schedule.reservedTimeslots ||
        schedule.reservedTimeslots.length === 0
      ) {
        return Infinity;
      }
      return Math.min(
        ...schedule.reservedTimeslots.map((ts) => timeToMinutes(ts.startTime))
      );
    };

    const getTimeRange = (schedule) => {
      if (
        !schedule.reservedTimeslots ||
        schedule.reservedTimeslots.length === 0
      ) {
        return "No time slots";
      }

      const sortedSlots = [...schedule.reservedTimeslots].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      );

      const firstSlot = sortedSlots[0];
      const lastSlot = sortedSlots[sortedSlots.length - 1];

      return `${firstSlot.day} ${firstSlot.startTime}-${lastSlot.endTime}`;
    };

    const sortedSchedules = [...schedules].sort((a, b) => {
      // First sort by day
      const dayA = a.reservedTimeslots[0]?.day;
      const dayB = b.reservedTimeslots[0]?.day;
      const dayDiff = (dayOrder[dayA] || 0) - (dayOrder[dayB] || 0);

      if (dayDiff !== 0) return dayDiff;

      // Then sort by time
      return getEarliestTime(a) - getEarliestTime(b);
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
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: "single", size: 1, color: "000000" },
                bottom: { style: "single", size: 1, color: "000000" },
                left: { style: "single", size: 1, color: "000000" },
                right: { style: "single", size: 1, color: "000000" },
                insideHorizontal: { style: "single", size: 1, color: "000000" },
                insideVertical: { style: "single", size: 1, color: "000000" },
              },
              rows: [
                // Header row
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Course")],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph("Lecture")],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph("Student Group")],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph("Room")],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph("Time")],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                // Data rows
                ...sortedSchedules.map(
                  (schedule) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph(
                              `${schedule.activity.course.courseCode} - ${schedule.activity.course.name}`
                            ),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph(schedule.activity.lecture.name),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph(
                              `${schedule.activity.studentGroup.department} Year ${schedule.activity.studentGroup.year} Section ${schedule.activity.studentGroup.section}`
                            ),
                          ],
                        }),
                        new TableCell({
                          children: [new Paragraph(schedule.room.name)],
                        }),
                        new TableCell({
                          children: [new Paragraph(getTimeRange(schedule))],
                        }),
                      ],
                    })
                ),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    // Set proper headers for the Word document
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename=Schedule_${decodedSemester.replace(
        /\s/g,
        "_"
      )}_${sortedSchedules[0].activity.lecture.name.replace(/\s/g, "_")}.docx`,
      "Content-Length": buffer.length,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Expires: "0",
    });

    return res.send(buffer);
  } catch (error) {
    console.error("Error exporting lecture schedule:", error);
    return res.status(500).json({
      error: `Failed to export lecture schedule: ${error.message}`,
      details: error.stack,
    });
  }
});

// Add this new endpoint before the export endpoint
router.get("/:semester/lectures/search", async (req, res) => {
  try {
    const { semester } = req.params;
    const { name } = req.query;
    const decodedSemester = decodeURIComponent(semester);

    if (!name) {
      return res.status(400).json({ error: "Name parameter is required" });
    }

    const trimmedName = name.trim();

    const lectures = await Lecture.find({
      name: { $regex: trimmedName, $options: "i" },
      isDeleted: false,
    }).lean();

    if (!lectures || lectures.length === 0) {
      return res
        .status(404)
        .json({ error: "No lectures found matching the name" });
    }

    const activities = await Activity.find({
      lecture: { $in: lectures.map((l) => l._id) },
      isDeleted: false,
    }).lean();

    if (!activities || activities.length === 0) {
      return res
        .status(404)
        .json({ error: "No activities found for these lectures" });
    }

    const schedules = await Schedule.find({
      semester: { $regex: `^${decodedSemester}$`, $options: "i" },
      activity: { $in: activities.map((a) => a._id) },
    })
      .populate({
        path: "activity",
        populate: [
          { path: "course", select: "courseCode name" },
          { path: "lecture", select: "name maxLoad" },
          { path: "studentGroup", select: "department year section" },
        ],
      })
      .populate("room", "name")
      .populate("reservedTimeslots", "day startTime endTime duration")
      .lean();

    const lectureSchedules = schedules.reduce((acc, schedule) => {
      const lectureId = schedule.activity?.lecture?._id?.toString();
      const lecture = schedule.activity?.lecture;

      if (lectureId && lecture && !lecture.isDeleted) {
        if (!acc[lectureId]) {
          acc[lectureId] = {
            name: lecture.name,
            maxLoad: lecture.maxLoad,
            schedules: [],
          };
        }
        acc[lectureId].schedules.push(schedule);
      }
      return acc;
    }, {});

    if (Object.keys(lectureSchedules).length === 0) {
      return res.status(404).json({
        error: `No schedules found for matching lectures in ${decodedSemester}`,
      });
    }

    res.json(lectureSchedules);
  } catch (err) {
    console.error("Error searching lectures:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:semester/scheduled-activities", async (req, res) => {
  try {
    const { semester } = req.params;
    const decodedSemester = decodeURIComponent(semester);

    const schedules = await Schedule.find({
      semester: decodedSemester,
    }).select("activity");

    const scheduledActivityIds = schedules.map((schedule) => schedule.activity);

    const activities = await Activity.find({
      _id: { $in: scheduledActivityIds },
      isDeleted: false,
    })
      .populate("course", "courseCode name")
      .populate("lecture", "name maxLoad")
      .populate("studentGroup", "department year section expectedEnrollment")
      .populate("createdBy", "username name")
      .lean();

    if (!activities || activities.length === 0) {
      return res.status(404).json({
        error: `No scheduled activities found for semester: ${decodedSemester}`,
      });
    }

    res.json(activities);
  } catch (err) {
    console.error("Error fetching scheduled activities for semester:", err);
    res.status(500).json({ error: err.message });
  }
});

function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

router.delete("/:semester", async (req, res) => {
  try {
    const { semester } = req.params;
    const decodedSemester = decodeURIComponent(semester);

    await Schedule.deleteMany({ semester: decodedSemester });
    res.json({ message: "All schedules deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new route for checking worker status
router.get("/status/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    const status = await checkWorkerStatus(workerId);
    res.json(status);
  } catch (err) {
    console.error("Error checking worker status:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
