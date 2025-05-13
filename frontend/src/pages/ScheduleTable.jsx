import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchSchedules, fetchTimeslots } from "@/services/api";
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
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeslotsLoading, setTimeslotsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeslotsError, setTimeslotsError] = useState(null);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Parse time to minutes since midnight, assuming 24-hour format (e.g., "2:00")
  const parseTime = (timeStr) => {
    if (!timeStr) {
      console.warn("Invalid time string:", timeStr);
      return 0;
    }
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + (minutes || 0);
  };

  // Find all activities that overlap with the given timeslot on the specified day
  const findActivities = (entries, timeslot, day) => {
    if (!entries || !Array.isArray(entries)) return [];
    if (!timeslot || !timeslot.startTime || !timeslot.endTime) {
      console.warn("Invalid timeslot:", timeslot);
      return [];
    }
    const slotStart = parseTime(timeslot.startTime);
    const slotEnd = parseTime(timeslot.endTime);
    const activities = entries.filter((entry) => {
      if (
        !entry ||
        !entry.timeslot ||
        !entry.timeslot.startTime ||
        !entry.timeslot.endTime ||
        !entry.timeslot.day
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
          `Entry ${entry._id} does not overlap: ${entry.timeslot.startTime}-${entry.timeslot.endTime} vs ${timeslot.startTime}-${timeslot.endTime} on ${day}`
        );
      }
      return overlaps;
    });
    return activities;
  };

  // Fetch schedules and timeslots
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

    const fetchTimeslotsData = async () => {
      try {
        setTimeslotsLoading(true);
        setTimeslotsError(null);
        const timeslotsData = await fetchTimeslots();
        if (timeslotsData && Array.isArray(timeslotsData)) {
          // Filter out deleted timeslots and sort by startTime
          const filteredTimeslots = timeslotsData
            .filter((ts) => !ts.isDeleted)
            .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
          setTimeslots(filteredTimeslots);
          toast.success("Timeslots loaded successfully");
          console.log("Fetched timeslots:", filteredTimeslots);
        } else {
          setTimeslots([]);
          toast.error("No timeslots found");
          console.warn("No timeslots returned");
        }
      } catch (err) {
        setTimeslotsError(
          `Error fetching timeslots: ${
            err.response?.data?.error || err.message
          }`
        );
        toast.error(err.response?.data?.error || "Failed to load timeslots", {
          description: "Unable to fetch timeslots from the server",
        });
        console.error("Timeslots fetch error:", err);
      } finally {
        setTimeslotsLoading(false);
      }
    };

    fetchData();
    fetchTimeslotsData();
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
              {timeslots
                .filter((ts) => ts.day === days[0]) // Use timeslots from one day (e.g., Monday) to define time slots
                .map((timeslot) => (
                  <TableRow key={`${timeslot._id}`}>
                    <TableCell>{`${timeslot.startTime}-${timeslot.endTime}`}</TableCell>
                    {days.map((day) => {
                      // Find the timeslot for the current day with matching start and end times
                      const currentTimeslot =
                        timeslots.find(
                          (ts) =>
                            ts.day === day &&
                            ts.startTime === timeslot.startTime &&
                            ts.endTime === timeslot.endTime
                        ) || timeslot;
                      const activities = findActivities(
                        entries,
                        currentTimeslot,
                        day
                      );
                      return (
                        <TableCell key={`${day}-${timeslot._id}`}>
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
                                    Lecture:{" "}
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

      {loading || timeslotsLoading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error || timeslotsError ? (
        <Card>
          <CardContent>
            <p className="text-destructive">{error || timeslotsError}</p>
          </CardContent>
        </Card>
      ) : allSchedules && timeslots.length > 0 ? (
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
              Failed to load schedules or timeslots for {decodedSemester}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScheduleTable;
