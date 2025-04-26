import React, { useState } from "react";
import { generateSchedule, fetchSchedules } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [semester, setSemester] = useState(1);
  const [schedule, setSchedule] = useState(null);
  const [allSchedules, setAllSchedules] = useState(null);

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

  const handleGenerateSchedule = async () => {
    try {
      const scheduleData = await generateSchedule(semester);
      setSchedule(scheduleData || null); // Ensure null if invalid
      alert("Schedule generated successfully!");
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleFetchSchedules = async () => {
    try {
      const schedulesData = await fetchSchedules();
      setAllSchedules(Array.isArray(schedulesData) ? schedulesData : null);
      alert("Schedules fetched successfully!");
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  // Helper function to get unique student groups
  const getStudentGroups = (schedules) => {
    const groups = new Set();
    if (schedules) {
      (Array.isArray(schedules) ? schedules : [schedules])
        .filter((sched) => sched && typeof sched === "object") // Filter out null/undefined
        .forEach((sched) => {
          (sched.activities || []).forEach((activity) => {
            if (activity?.studentGroup) {
              groups.add(activity.studentGroup);
            }
          });
        });
    }
    return Array.from(groups);
  };

  // Helper function to find activity for a specific time slot and day
  const findActivity = (activities, timeSlot, day, studentGroup) => {
    return activities?.find((activity) => {
      if (!activity || activity.studentGroup !== studentGroup) return false;
      if (activity.day !== day) return false;
      // Match time slot (assuming time is in format "HH:MM-HH:MM" or "HH:MM")
      const activityTime = activity.time?.split("-")[0]; // Get start time
      return timeSlot.startsWith(activityTime);
    });
  };

  // Helper function to render timetable for a student group
  const renderTimetable = (activities, studentGroup) => (
    <Card key={studentGroup}>
      <CardHeader>
        <CardTitle>Timetable for {studentGroup}</CardTitle>
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
                  const activity = findActivity(
                    activities,
                    timeSlot,
                    day,
                    studentGroup
                  );
                  return (
                    <TableCell key={`${day}-${timeSlot}`}>
                      {activity ? (
                        <div>
                          <div>
                            {activity.course?.code} - {activity.course?.name}
                          </div>
                          <div>
                            Instructor: {activity.instructor?.name || "N/A"}
                          </div>
                          <div>Room: {activity.room || "N/A"}</div>
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

  // Combine activities from schedule and allSchedules
  const combinedActivities = [
    ...(schedule?.activities || []),
    ...(allSchedules
      ?.filter((sched) => sched && typeof sched === "object") // Filter out null/undefined
      .flatMap((sched) => sched.activities || [])
      .filter(
        (activity) =>
          !schedule?.activities?.some(
            (a) =>
              a.course?._id === activity.course?._id &&
              a.day === activity.day &&
              a.time === activity.time &&
              a.studentGroup === activity.studentGroup
          )
      ) || []),
  ].filter((activity) => activity && typeof activity === "object"); // Ensure valid activities

  // Get unique student groups
  const studentGroups = getStudentGroups([schedule, ...(allSchedules || [])]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Schedule Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-4">
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input
                type="number"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                min="1"
                step="1"
                className="w-32"
              />
            </div>
            <Button onClick={handleGenerateSchedule}>Generate Schedule</Button>
          </div>
        </CardContent>
      </Card>

      {/* Fetch All Schedules */}
      <Card>
        <CardHeader>
          <CardTitle>View All Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleFetchSchedules}>Fetch All Schedules</Button>
        </CardContent>
      </Card>

      {/* Display Timetables for Each Student Group */}
      {studentGroups.length > 0 ? (
        studentGroups.map((group) => renderTimetable(combinedActivities, group))
      ) : (
        <Card>
          <CardContent>
            <p className="text-muted-foreground">
              No schedules or student groups available.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScheduleTable;
