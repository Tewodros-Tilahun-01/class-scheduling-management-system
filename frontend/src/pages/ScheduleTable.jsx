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
import axios from "axios";
import { saveAs } from "file-saver";

const ScheduleTable = () => {
  const { semester } = useParams();
  const decodedSemester = decodeURIComponent(semester);
  const [allSchedules, setAllSchedules] = useState(null);
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeslotsLoading, setTimeslotsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeslotsError, setTimeslotsError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + (minutes || 0);
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  const findActivities = (entries, timeslot, day) => {
    if (!entries || !Array.isArray(entries)) return [];
    const slotStart = parseTime(timeslot.startTime);
    const slotEnd = parseTime(timeslot.endTime);

    return entries.filter((entry) => {
      if (!entry || !entry.timeslot) return false;
      const primaryTimeslot = entry.timeslot;
      if (primaryTimeslot.day !== day) return false;

      const startTime = parseTime(primaryTimeslot.startTime);
      const endTime = startTime + entry.totalDuration;
      return startTime < slotEnd && endTime > slotStart;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const schedulesData = await fetchSchedules({
          semester: decodedSemester,
        });
        if (schedulesData && typeof schedulesData === "object") {
          setAllSchedules(schedulesData);
          toast.success("Schedules loaded successfully", {
            description: `Fetched schedules for ${decodedSemester}`,
          });
        } else {
          setAllSchedules(null);
          toast.error("No schedules found", {
            description: `No schedules available for ${decodedSemester}`,
          });
        }
      } catch (err) {
        setError(`Error fetching schedules: ${err.message}`);
        toast.error("Failed to load schedules", {
          description: "Unable to fetch schedules from the server",
        });
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
          const filteredTimeslots = timeslotsData
            .filter((ts) => !ts.isDeleted)
            .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
          setTimeslots(filteredTimeslots);
          toast.success("Timeslots loaded successfully");
        } else {
          setTimeslots([]);
          toast.error("No timeslots found");
        }
      } catch (err) {
        setTimeslotsError(`Error fetching timeslots: ${err.message}`);
        toast.error("Failed to load timeslots", {
          description: "Unable to fetch timeslots from the server",
        });
      } finally {
        setTimeslotsLoading(false);
      }
    };

    fetchData();
    fetchTimeslotsData();
  }, [decodedSemester]);

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/schedules/${encodeURIComponent(
          decodedSemester
        )}/export`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      saveAs(blob, `Schedule_${decodedSemester.replace(/\s/g, "_")}.docx`);

      toast.success("Schedule exported successfully", {
        description: `Downloaded schedule for ${decodedSemester}`,
      });
    } catch (err) {
      toast.error("Failed to export schedule", {
        description: err.message,
      });
    } finally {
      setExportLoading(false);
    }
  };

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
                .filter((ts) => ts.day === days[0])
                .map((timeslot) => (
                  <TableRow key={`${timeslot._id}`}>
                    <TableCell>{`${timeslot.startTime}-${timeslot.endTime}`}</TableCell>
                    {days.map((day) => {
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
                              {activities.map((entry) => {
                                const startTime = parseTime(
                                  entry.timeslot.startTime
                                );
                                const endTime = startTime + entry.totalDuration;
                                return (
                                  <div
                                    key={entry._id}
                                    style={{
                                      minHeight: `${
                                        (entry.totalDuration / 60) * 50
                                      }px`,
                                    }}
                                  >
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
                                );
                              })}
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
        <CardContent className="flex space-x-4">
          <Button asChild variant="link">
            <Link to="/">Back to Semesters</Link>
          </Button>
          <Button
            onClick={handleExport}
            disabled={
              exportLoading || !allSchedules || loading || timeslotsLoading
            }
            className="ml-auto"
          >
            {exportLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              "Export Schedule"
            )}
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
