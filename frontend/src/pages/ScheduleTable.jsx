import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const ScheduleTable = () => {
  const { semester } = useParams();
  const decodedSemester = decodeURIComponent(semester);
  const [allSchedules, setAllSchedules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const timeSlots = [
    "8:00-9:00",
    "9:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-1:00",
    "1:00-2:00",
    "2:00-3:00",
    "3:00-4:00",
  ];

  // Parse time to minutes since midnight, assuming 24-hour format
  const parseTime = (timeStr) => {
    let [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Find all activities that overlap with the fixed time slot on the given day
  const findActivities = (entries, timeSlot, day) => {
    if (!entries || !Array.isArray(entries)) return [];
    const [slotStart, slotEnd] = timeSlot.split("-").map(parseTime);
    const activities = entries.filter((entry) => {
      if (
        !entry ||
        !entry.timeslot ||
        !entry.timeslot.startTime ||
        !entry.timeslot.endTime
      ) {
        console.warn("Invalid entry:", entry);
        return false;
      }
      if (entry.timeslot.day !== day) return false;
      const scheduleStart = parseTime(entry.timeslot.startTime);
      const scheduleEnd = parseTime(entry.timeslot.endTime);
      const overlaps = scheduleStart < slotEnd && scheduleEnd > slotStart;
      if (!overlaps) {
        console.debug(
          `Entry ${entry._id} does not overlap: ${entry.timeslot.startTime}-${entry.timeslot.endTime} vs ${timeSlot} on ${day}`
        );
      }
      return overlaps;
    });
    return activities;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const schedulesData = await fetchSchedules({
          semester: decodedSemester,
        });
        if (
          schedulesData &&
          typeof schedulesData === "object" &&
          Object.keys(schedulesData).length > 0
        ) {
          setAllSchedules(schedulesData);
          toast.success("Schedules loaded successfully", {
            description: `Fetched schedules for ${decodedSemester}`,
          });
          console.log("Fetched schedules:", schedulesData);
        } else {
          setAllSchedules(null);
          toast.error("No schedules found", {
            description: `No schedules available for ${decodedSemester}`,
          });
          console.warn("No schedules returned for semester:", decodedSemester);
        }
      } catch (err) {
        setError(
          `Error fetching schedules: ${
            err.response?.data?.error || err.message
          }`
        );
        toast.error(err.response?.data?.error || "Failed to load schedules", {
          description: "Unable to fetch schedules from the server",
        });
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [decodedSemester]);

  const renderTimetable = (groupData) => {
    const studentGroup = groupData.studentGroup || {};
    const entries = Array.isArray(groupData.entries) ? groupData.entries : [];

    return (
      <Card key={studentGroup._id || "unknown"}>
        <CardHeader>
          <CardTitle>
            Timetable for{" "}
            {studentGroup.department
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
                    const activities = findActivities(entries, timeSlot, day);
                    return (
                      <TableCell key={`${day}-${timeSlot}`}>
                        {activities.length > 0 ? (
                          <div className="space-y-2">
                            {activities.map((entry, index) => (
                              <div key={entry._id || index}>
                                <div>
                                  {entry.activity?.course
                                    ? `${entry.activity.course.courseCode} - ${entry.activity.course.name}`
                                    : "Course N/A"}
                                </div>
                                <div>
                                  lecture:{" "}
                                  {entry.activity?.lecture?.name || "N/A"}
                                </div>
                                <div>Room: {entry.room?.name || "N/A"}</div>
                              </div>
                            ))}
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
      <Card>
        <CardHeader>
          <CardTitle>Schedules for {decodedSemester}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="link">
            <Link to="/">Back to Semesters</Link>
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : allSchedules ? (
        Object.values(allSchedules).length > 0 ? (
          Object.values(allSchedules)
            .filter(
              (groupData) => groupData && Array.isArray(groupData.entries)
            )
            .map((groupData) => renderTimetable(groupData))
        ) : (
          <Card>
            <CardContent>
              <p className="text-muted-foreground">
                No schedules found for {decodedSemester}.
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent>
            <p className="text-muted-foreground">
              Failed to load schedules for {decodedSemester}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScheduleTable;
