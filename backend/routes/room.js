const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
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

// GET /api/rooms - Retrieve all active rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find({ isDeleted: false }).lean();
    res.json(rooms);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ error: err.message || "Failed to fetch rooms" });
  }
});

// GET /api/rooms/room-types - Retrieve distinct room types
router.get("/room-types", async (req, res) => {
  const { active } = req.query;
  let qurey = null;
  if (active) {
    qurey = {
      isDeleted: false,
      active: true,
    };
    try {
      const roomTypes = await Room.distinct("type", qurey);
      res.json(roomTypes);
    } catch (err) {
      console.error("Error fetching room types:", err);
      res
        .status(500)
        .json({ error: err.message || "Failed to fetch room types" });
    }
  } else {
    res.status(200).json(["lecture", "lab", "seminar", "other"]);
  }
});

// POST /api/rooms - Create a new room
router.post("/", async (req, res) => {
  try {
    const { name, capacity, type, building, active } = req.body;

    // Validate required fields
    if (!name || !capacity || !type || !building) {
      return res
        .status(400)
        .json({ error: "Name, capacity, type, and building are required" });
    }

    // Check for duplicate room name
    const existingRoom = await Room.findOne({ name, isDeleted: false });
    if (existingRoom) {
      return res.status(400).json({ error: "Room name already exists" });
    }

    const room = new Room({
      name,
      capacity,
      type,
      building,
      active: active !== undefined ? active : true, // Default to true if not provided
    });

    await room.save();
    res.status(201).json(room);
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ error: err.message || "Failed to create room" });
  }
});

// PUT /api/rooms/:id - Update an existing room
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, type, building, active } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid room ID" });
    }

    // Validate required fields
    if (!name || !capacity || !type || !building) {
      return res
        .status(400)
        .json({ error: "Name, capacity, type, and building are required" });
    }

    // Check for duplicate room name (excluding the current room)
    const existingRoom = await Room.findOne({
      name,
      _id: { $ne: id },
      isDeleted: false,
    });
    if (existingRoom) {
      return res.status(400).json({ error: "Room name already exists" });
    }

    const room = await Room.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        name,
        capacity,
        type,
        building,
        active: active !== undefined ? active : true,
      },
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({ error: "Room not found or deleted" });
    }

    res.json(room);
  } catch (err) {
    console.error("Error updating room:", err);
    res.status(500).json({ error: err.message || "Failed to update room" });
  }
});

// DELETE /api/rooms/:id - Soft delete a room
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid room ID" });
    }

    // Check if room is referenced by any schedules
    const schedule = await Schedule.findOne({ room: id });
    if (schedule) {
      return res.status(400).json({ error: "Room is linked to a schedule" });
    }

    const room = await Room.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!room) {
      return res
        .status(404)
        .json({ error: "Room not found or already deleted" });
    }

    res.json({ message: "Room soft deleted successfully" });
  } catch (err) {
    console.error("Error deleting room:", err);
    res.status(500).json({ error: err.message || "Failed to delete room" });
  }
});

//  for free rooms
router.get("/:semester/free-rooms", async (req, res) => {
  try {
    const { semester } = req.params;
    const { day, timeslot } = req.query;
    const timeslotId = timeslot;

    if (!day || !timeslotId) {
      return res.status(400).json({
        error: "Both day and timeslotId are required parameters",
      });
    }

    // First get the timeslotId details
    const timeslotDetails = await mongoose
      .model("Timeslot")
      .findById(timeslotId)
      .lean();

    if (!timeslotDetails) {
      return res.status(404).json({
        error: "Timeslot not found",
      });
    }

    // Get all active rooms
    const allRooms = await Room.find({
      active: true,
      isDeleted: false,
    }).lean();

    // Get all schedules for the semester that use this timeslot
    const occupiedSchedules = await Schedule.find({
      semester,
      reservedTimeslots: { $in: [timeslotId] },
    }).lean();

    // Create a set of occupied room IDs
    const occupiedRoomIds = new Set(
      occupiedSchedules.map((schedule) => schedule.room.toString())
    );

    // Filter out occupied rooms
    const freeRooms = allRooms.filter(
      (room) => !occupiedRoomIds.has(room._id.toString())
    );

    res.json({
      day,
      timeSlot: {
        startTime: timeslotDetails.startTime,
        endTime: timeslotDetails.endTime,
      },
      rooms: freeRooms,
    });
  } catch (err) {
    console.error("Error fetching free rooms:", err);
    res.status(500).json({
      error: err.message || "Failed to fetch free rooms",
    });
  }
});

// Export room report
router.get("/:semester/export-report", async (req, res) => {
  try {
    const { semester } = req.params;
    const decodedSemester = decodeURIComponent(semester);

    // Get all active rooms
    const rooms = await Room.find({ isDeleted: false, active: true }).lean();

    if (!rooms.length) {
      return res.status(404).json({ error: "No active rooms found" });
    }

    // Get all schedules for the semester
    const schedules = await Schedule.find({ semester: decodedSemester })
      .populate({
        path: "activity",
        populate: [
          { path: "course", select: "courseCode" },
          { path: "lecture", select: "name" },
        ],
      })
      .populate("reservedTimeslots", "day startTime endTime duration")
      .lean();

    // Get all unique days from the schedules
    const days = [
      ...new Set(
        schedules.flatMap((s) => s.reservedTimeslots.map((ts) => ts.day))
      ),
    ].sort((a, b) => {
      const dayOrder = {
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };
      return dayOrder[a] - dayOrder[b];
    });

    // Create the document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Room Utilization Report - ${decodedSemester}`,
                  bold: true,
                  size: 28,
                }),
              ],
              spacing: { after: 400 },
            }),
            ...rooms
              .map((room, roomIndex) => {
                // Filter schedules for this room
                const roomSchedules = schedules.filter(
                  (s) => s.room.toString() === room._id.toString()
                );

                // Create a map of schedules by day and time
                const scheduleMap = {};
                const conflicts = [];

                // Create a Set to track unique timeslots
                const uniqueTimeslots = new Set();

                roomSchedules.forEach((schedule) => {
                  schedule.reservedTimeslots.forEach((ts) => {
                    if (!scheduleMap[ts.day]) {
                      scheduleMap[ts.day] = [];
                    }

                    // Create a unique key for this timeslot
                    const timeslotKey = `${ts.day}-${ts.startTime}-${ts.endTime}`;

                    // Only add if this timeslot hasn't been seen before
                    if (!uniqueTimeslots.has(timeslotKey)) {
                      uniqueTimeslots.add(timeslotKey);

                      // Check for conflicts
                      const existingSchedule = scheduleMap[ts.day].find(
                        (s) =>
                          (ts.startTime >= s.time.split("-")[0] &&
                            ts.startTime < s.time.split("-")[1]) ||
                          (ts.endTime > s.time.split("-")[0] &&
                            ts.endTime <= s.time.split("-")[1])
                      );

                      if (existingSchedule) {
                      }

                      scheduleMap[ts.day].push({
                        time: `${ts.startTime}-${ts.endTime}`,
                        activity: schedule.activity,
                      });
                    }
                  });
                });

                // Sort schedules by time within each day
                Object.keys(scheduleMap).forEach((day) => {
                  scheduleMap[day].sort((a, b) => {
                    const [aStart] = a.time.split("-");
                    const [bStart] = b.time.split("-");
                    return aStart.localeCompare(bStart);
                  });
                });

                return [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Room: ${room.name} (${room.type}) - Capacity: ${room.capacity}`,
                        bold: true,
                        size: 24,
                      }),
                    ],
                    spacing: { after: 200 },
                  }),
                  // Add conflicts section if there are any
                  ...(conflicts.length > 0
                    ? [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "⚠️ Schedule Conflicts:",
                              bold: true,
                              color: "FF0000",
                            }),
                          ],
                          spacing: { after: 200 },
                        }),
                        new Table({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          borders: {
                            top: { style: "single", size: 1, color: "FF0000" },
                            bottom: {
                              style: "single",
                              size: 1,
                              color: "FF0000",
                            },
                            left: { style: "single", size: 1, color: "FF0000" },
                            right: {
                              style: "single",
                              size: 1,
                              color: "FF0000",
                            },
                            insideHorizontal: {
                              style: "single",
                              size: 1,
                              color: "FF0000",
                            },
                            insideVertical: {
                              style: "single",
                              size: 1,
                              color: "FF0000",
                            },
                          },
                          rows: [
                            new TableRow({
                              children: [
                                new TableCell({
                                  children: [new Paragraph("Day")],
                                  width: {
                                    size: 25,
                                    type: WidthType.PERCENTAGE,
                                  },
                                }),
                                new TableCell({
                                  children: [new Paragraph("Time")],
                                  width: {
                                    size: 25,
                                    type: WidthType.PERCENTAGE,
                                  },
                                }),
                                new TableCell({
                                  children: [
                                    new Paragraph("Conflicting Courses"),
                                  ],
                                  width: {
                                    size: 50,
                                    type: WidthType.PERCENTAGE,
                                  },
                                }),
                              ],
                            }),
                            ...conflicts.map(
                              (conflict) =>
                                new TableRow({
                                  children: [
                                    new TableCell({
                                      children: [new Paragraph(conflict.day)],
                                    }),
                                    new TableCell({
                                      children: [new Paragraph(conflict.time)],
                                    }),
                                    new TableCell({
                                      children: [
                                        new Paragraph(
                                          `${conflict.course} conflicts with ${conflict.existingCourse}`
                                        ),
                                      ],
                                    }),
                                  ],
                                })
                            ),
                          ],
                        }),
                        new Paragraph({ spacing: { after: 400 } }),
                      ]
                    : []),
                  new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: "single", size: 1, color: "000000" },
                      bottom: { style: "single", size: 1, color: "000000" },
                      left: { style: "single", size: 1, color: "000000" },
                      right: { style: "single", size: 1, color: "000000" },
                      insideHorizontal: {
                        style: "single",
                        size: 1,
                        color: "000000",
                      },
                      insideVertical: {
                        style: "single",
                        size: 1,
                        color: "000000",
                      },
                    },
                    rows: [
                      // Header row
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph("Day")],
                            width: { size: 25, type: WidthType.PERCENTAGE },
                          }),
                          new TableCell({
                            children: [new Paragraph("Time")],
                            width: { size: 25, type: WidthType.PERCENTAGE },
                          }),
                          new TableCell({
                            children: [new Paragraph("Course")],
                            width: { size: 25, type: WidthType.PERCENTAGE },
                          }),
                          new TableCell({
                            children: [new Paragraph("Lecture")],
                            width: { size: 25, type: WidthType.PERCENTAGE },
                          }),
                        ],
                      }),
                      // Data rows
                      ...days.flatMap((day) => {
                        const daySchedules = scheduleMap[day] || [];
                        if (daySchedules.length === 0) {
                          return [
                            new TableRow({
                              children: [
                                new TableCell({
                                  children: [new Paragraph(day)],
                                }),
                                new TableCell({
                                  children: [new Paragraph("No schedules")],
                                  colSpan: 3,
                                }),
                              ],
                            }),
                          ];
                        }

                        return daySchedules.map(
                          (schedule) =>
                            new TableRow({
                              children: [
                                new TableCell({
                                  children: [new Paragraph(day)],
                                }),
                                new TableCell({
                                  children: [new Paragraph(schedule.time)],
                                }),
                                new TableCell({
                                  children: [
                                    new Paragraph(
                                      schedule.activity.course.courseCode
                                    ),
                                  ],
                                }),
                                new TableCell({
                                  children: [
                                    new Paragraph(
                                      schedule.activity.lecture.name
                                    ),
                                  ],
                                }),
                              ],
                            })
                        );
                      }),
                    ],
                  }),
                  new Paragraph({ spacing: { after: 400 } }),
                ];
              })
              .flat(),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    // Set proper headers for the Word document
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename=Room_Report_${decodedSemester.replace(
        /\s/g,
        "_"
      )}.docx`,
      "Content-Length": buffer.length,
    });

    return res.send(buffer);
  } catch (error) {
    console.error("Error exporting room report:", error);
    return res.status(500).json({
      error: `Failed to export room report: ${error.message}`,
      details: error.stack,
    });
  }
});

module.exports = router;
