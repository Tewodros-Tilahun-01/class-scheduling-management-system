import React, { useState, useEffect } from "react";
import { fetchSchedules } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ScheduleTable = () => {
  const [allSchedules, setAllSchedules] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [semesters, setSemesters] = useState([]);

  // Define days and time slots
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const timeSlots = [
    "08:00-09:00",
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
    "17:00-18:00",
  ];

  // Fetch all schedules on mount to extract distinct semesters
  useEffect(() => {
    const fetchData = async () => {
      try {
        const schedulesData = await fetchSchedules();
        if (schedulesData && typeof schedulesData === "object") {
          // Extract distinct semesters from schedules
          const uniqueSemesters = [
            ...new Set(
              Object.values(schedulesData).flatMap((group) =>
                group.entries.map((entry) => entry.activity.semester)
              )
            ),
          ];
          setSemesters(uniqueSemesters);
          setAllSchedules(schedulesData);
        }
      } catch (err) {
        alert(
          `Error fetching schedules: ${
            err.response?.data?.error || err.message
          }`
        );
      }
    };
    fetchData();
  }, []);

  // Fetch schedules for a specific semester when a link is clicked
  const handleFetchSemesterSchedules = async (semester) => {
    try {
      setSelectedSemester(semester);
      const response = await fetchSchedules(semester);
      setAllSchedules(response || null);
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  // Helper function to find activity for a specific time slot and day
  const findActivity = (entries, timeSlot, day) => {
    return entries?.find((entry) => {
      if (!entry || !entry.timeslot) return false;
      return (
        entry.timeslot.day === day &&
        `${entry.timeslot.startTime}-${entry.timeslot.endTime}` === timeSlot
      );
    });
  };

  // Helper function to render timetable for a student group
  const renderTimetable = (groupData) => {
    const studentGroup = groupData.studentGroup;
    const entries = groupData.entries || [];

    return (
      <Card key={studentGroup?._id || "unknown"}>
        <CardHeader>
          <CardTitle>
            Timetable for{" "}
            {studentGroup
              ? `${studentGroup.department} Year ${studentGroup.year} Section ${studentGroup.section}`
              : "Unknown Group"}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                {days.map((day) => (
                  <TableHead key={day}>{day}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeSlots.map((timeSlot) => (
                <TableRow key={timeSlot}>
                  <TableCell>{timeSlot}</TableCell>
                  {days.map((day) => {
                    const entry = findActivity(entries, timeSlot, day);
                    return (
                      <TableCell key={`${day}-${timeSlot}`}>
                        {entry ? (
                          <div>
                            <div>
                              {entry.activity.course?.courseCode} -{" "}
                              {entry.activity.course?.name}
                            </div>
                            <div>
                              Instructor:{" "}
                              {entry.activity.instructor?.name || "N/A"}
                            </div>
                            <div>Room: {entry.room?.name || "N/A"}</div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* List of Distinct Semesters */}
      <Card>
        <CardHeader>
          <CardTitle>Schedules by Semester</CardTitle>
        </CardHeader>
        <CardContent>
          {semesters.length > 0 ? (
            <div className="space-x-4">
              {semesters.map((semester) => (
                <Button
                  key={semester}
                  variant="link"
                  onClick={() => handleFetchSemesterSchedules(semester)}
                >
                  {semester}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No schedules available.</p>
          )}
        </CardContent>
      </Card>

      {/* Display Schedules Grouped by Student Groups */}
      {allSchedules && selectedSemester ? (
        Object.values(allSchedules).length > 0 ? (
          Object.values(allSchedules).map((groupData) =>
            renderTimetable(groupData)
          )
        ) : (
          <Card>
            <CardContent>
              <p className="text-muted-foreground">
                No schedules found for {selectedSemester}.
              </p>
            </CardContent>
          </Card>
        )
      ) : selectedSemester ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground">
              Failed to load schedules for {selectedSemester}.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default ScheduleTable;
