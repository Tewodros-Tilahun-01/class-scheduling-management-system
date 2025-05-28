const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Schedule = require("../models/Schedule");
const Timeslot = require("../models/Timeslot");
const Lecture = require("../models/Lectures");
const Activity = require("../models/Activity");
require("../models/User");
require("../models/Course");
require("../models/StudentGroup");

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
// Add new endpoint for exporting latest semester schedule
router.get(
  "/group/:studentGroupId/latest-semester/export",
  async (req, res) => {
    try {
      const { studentGroupId } = req.params;
      console.log(studentGroupId);

      if (!studentGroupId) {
        return res.status(400).json({ error: "Student group ID is required" });
      }

      // Find all schedules for the student group with populated fields
      const schedules = await Schedule.find({
        studentGroup: studentGroupId,
      })
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

      console.log(schedules.length);
      if (!schedules || schedules.length === 0) {
        return res.status(404).json({ error: "No schedules found" });
      }

      // Sort schedules by semester (newest first)
      const sortedSchedules = schedules.sort((a, b) => {
        const [yearA, semA] = a.semester.split(" semester ");
        const [yearB, semB] = b.semester.split(" semester ");

        // First compare years
        if (yearA !== yearB) {
          return parseInt(yearB) - parseInt(yearA); // Descending order for years
        }
        // If years are equal, compare semester numbers
        return parseInt(semB) - parseInt(semA); // Descending order for semesters
      });

      // Get the latest semester
      const latestSemester = sortedSchedules[0].semester;

      // Filter schedules to only include those from the latest semester
      const latestSemesterSchedules = sortedSchedules.filter((schedule) => {
        return schedule.semester === latestSemester;
      });

      console.log(latestSemesterSchedules.length);
      if (!latestSemesterSchedules.length) {
        return res
          .status(404)
          .json({ error: "No schedules found for the latest semester" });
      }

      // Get student group info
      const studentGroup = latestSemesterSchedules[0].activity.studentGroup;
      if (!studentGroup) {
        return res
          .status(404)
          .json({ error: "Student group information not found" });
      }

      // Create the document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Schedule for ${latestSemester}`,
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: { after: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${studentGroup.department} Year ${studentGroup.year} Section ${studentGroup.section}`,
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),
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
                  insideVertical: { style: "single", size: 1, color: "000000" },
                },
                rows: [
                  // Header row
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph("Day")],
                        width: { size: 20, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph("Time")],
                        width: { size: 20, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph("Course")],
                        width: { size: 30, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph("Room")],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph("Lecture")],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                    ],
                  }),
                  // Data rows
                  ...latestSemesterSchedules
                    .map((schedule) => {
                      const timeslots = schedule.reservedTimeslots.sort(
                        (a, b) => {
                          const dayOrder = {
                            Monday: 1,
                            Tuesday: 2,
                            Wednesday: 3,
                            Thursday: 4,
                            Friday: 5,
                            Saturday: 6,
                          };
                          if (a.day !== b.day)
                            return dayOrder[a.day] - dayOrder[b.day];
                          return a.startTime.localeCompare(b.startTime);
                        }
                      );

                      return timeslots.map(
                        (ts, index) =>
                          new TableRow({
                            children: [
                              new TableCell({
                                children: [new Paragraph(ts.day)],
                              }),
                              new TableCell({
                                children: [
                                  new Paragraph(
                                    `${ts.startTime}-${ts.endTime}`
                                  ),
                                ],
                              }),
                              new TableCell({
                                children: [
                                  new Paragraph(
                                    `${schedule.activity.course.courseCode} - ${schedule.activity.course.name}`
                                  ),
                                ],
                              }),
                              new TableCell({
                                children: [new Paragraph(schedule.room.name)],
                              }),
                              new TableCell({
                                children: [
                                  new Paragraph(schedule.activity.lecture.name),
                                ],
                              }),
                            ],
                          })
                      );
                    })
                    .flat(),
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
        "Content-Disposition": `attachment; filename=Schedule_${latestSemester.replace(
          /\s/g,
          "_"
        )}_${studentGroup.department}_Year${studentGroup.year}_Section${
          studentGroup.section
        }.docx`,
        "Content-Length": buffer.length,
      });

      return res.send(buffer);
    } catch (error) {
      console.error("Error exporting latest semester schedule:", error);
      return res.status(500).json({
        error: `Failed to export schedule: ${error.message}`,
        details: error.stack,
      });
    }
  }
);

// GET /api/schedules/group/:studentGroupId/latest-semester
router.get("/group/:studentGroupId/latest-semester", async (req, res) => {
  try {
    const { studentGroupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentGroupId)) {
      return res.status(400).json({ error: "Invalid student group ID" });
    }

    // Find all schedules for the student group with full population
    const schedules = await Schedule.find({
      studentGroup: studentGroupId,
    })
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

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        error: "No schedules found for this student group",
      });
    }

    // Sort schedules by semester (newest first)
    const sortedSchedules = schedules.sort((a, b) => {
      const [yearA, semA] = a.semester.split(" semester ");
      const [yearB, semB] = b.semester.split(" semester ");

      // First compare years
      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA); // Descending order for years
      }
      // If years are equal, compare semester numbers
      return parseInt(semB) - parseInt(semA); // Descending order for semesters
    });

    // Get the latest semester
    const latestSemester = sortedSchedules[0].semester;

    // Filter schedules to only include those from the latest semester
    const latestSemesterSchedules = sortedSchedules.filter((schedule) => {
      return schedule.semester === latestSemester;
    });

    console.log(latestSemesterSchedules.length);
    res.json({
      semester: latestSemester,
      schedules: latestSemesterSchedules,
    });
  } catch (err) {
    console.error("Error fetching latest semester:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
