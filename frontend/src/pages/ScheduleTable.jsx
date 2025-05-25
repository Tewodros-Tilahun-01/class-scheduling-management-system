import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchSchedules, fetchTimeslots, exportSchedule } from "@/services/api";
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
import {
  Loader2,
  Users,
  Home,
  RefreshCw,
  ArrowLeft,
  BarChart2,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { saveAs } from "file-saver";
import DashboardLayout from "@/layouts/DashboardLayout";

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

  // Parse "HH:MM" to minutes
  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + (minutes || 0);
  };

  // Build a map for quick timeslot lookup by _id
  const timeslotMap = React.useMemo(() => {
    const map = {};
    timeslots.forEach((ts) => {
      map[ts._id?.toString()] = ts;
    });
    return map;
  }, [timeslots]);

  // Helper: get sorted reserved timeslots for an entry
  const getSortedReservedTimeslots = (entry) => {
    if (!entry.reservedTimeslots || entry.reservedTimeslots.length === 0)
      return [];
    return [...entry.reservedTimeslots]
      .map((ts) => (typeof ts === "object" ? ts : timeslotMap[ts]))
      .filter(Boolean)
      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
  };

  // Find activities that overlap with a timeslot cell

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
      const data = await exportSchedule(decodedSemester);
      const blob = new Blob([data], {
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

  // Build a 2D array: rows = timeslots for the day, columns = days
  const renderTimetable = (groupData) => {
    const studentGroup = groupData.studentGroup || {};
    const entries = Array.isArray(groupData.entries) ? groupData.entries : [];

    // Get all unique days and all timeslots for each day
    const uniqueDays = [...new Set(timeslots.map((ts) => ts.day))];
    // For each day, get sorted timeslots
    const dayTimeslots = {};
    uniqueDays.forEach((day) => {
      dayTimeslots[day] = timeslots
        .filter((ts) => ts.day === day)
        .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
    });

    // Build a lookup: for each [day][timeslotId], which entry (if any) starts here
    const cellMap = {};
    entries.forEach((entry) => {
      const slots = getSortedReservedTimeslots(entry);
      if (slots.length === 0) return;
      const day = slots[0].day;
      const firstSlotId = slots[0]._id.toString();
      cellMap[`${day}-${firstSlotId}`] = { entry, span: slots.length };
      // Mark all slots covered by this entry so we can skip them later
      for (let i = 1; i < slots.length; i++) {
        cellMap[`${day}-${slots[i]._id.toString()}`] = { skip: true };
      }
    });

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
          <Table className="border border-black ">
            <TableHeader>
              <TableRow className="border border-black  ">
                <TableHead className="border border-black ">Time</TableHead>
                {uniqueDays.map((day) => (
                  <TableHead key={day} className="border border-black ">
                    {day}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* For each row (timeslot index) */}
              {(() => {
                // Find the max number of timeslots in any day
                const maxRows = Math.max(
                  ...uniqueDays.map((day) => dayTimeslots[day].length)
                );
                return Array.from({ length: maxRows }).map((_, rowIdx) => (
                  <TableRow
                    key={`row-${rowIdx}`}
                    className="border border-black "
                  >
                    {/* Time column: show the time for the first day that has this row */}
                    <TableCell className="border border-black ">
                      {(() => {
                        for (const day of uniqueDays) {
                          if (dayTimeslots[day][rowIdx]) {
                            const ts = dayTimeslots[day][rowIdx];
                            return `${ts.startTime}-${ts.endTime}`;
                          }
                        }
                        return "";
                      })()}
                    </TableCell>
                    {/* For each day, render the cell */}
                    {uniqueDays.map((day) => {
                      const ts = dayTimeslots[day][rowIdx];
                      if (!ts)
                        return (
                          <TableCell
                            key={day}
                            className="border border-black "
                          />
                        );
                      const cellKey = `${day}-${ts._id.toString()}`;
                      const cellInfo = cellMap[cellKey];
                      if (cellInfo?.skip) return null;
                      if (cellInfo?.entry) {
                        const entry = cellInfo.entry;
                        return (
                          <TableCell
                            key={day}
                            rowSpan={cellInfo.span}
                            className="border border-black "
                          >
                            <div>
                              {entry.activity?.course
                                ? `${entry.activity.course.courseCode} - ${entry.activity.course.name}`
                                : "Course N/A"}
                            </div>
                            <div>{entry.activity?.lecture?.name || "N/A"}</div>
                            <div>Room: {entry.room?.name || "N/A"}</div>
                            <div>
                              {entry.activity?.roomRequirement || "N/A"}
                            </div>
                            <div>
                              Time:{" "}
                              {(() => {
                                const slots = getSortedReservedTimeslots(entry);
                                return slots.length
                                  ? `${slots[0].startTime} - ${
                                      slots[slots.length - 1].endTime
                                    }`
                                  : "N/A";
                              })()}
                            </div>
                          </TableCell>
                        );
                      }
                      // No activity starts here
                      return (
                        <TableCell key={day} className="border border-black ">
                          <span className=" flex justify-center">-</span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ));
              })()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Navigation Links */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50">
          <div className="flex items-center gap-6">
            <Link
              to={`/schedules/${encodeURIComponent(semester)}/lectures`}
              className="flex items-center px-4 py-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-primary/10 mr-2">
                <Users className="h-4 w-4" />
              </div>
              <span className="font-medium">Lecture Schedules</span>
            </Link>
            <div className="h-8 w-px bg-border/50" />
            <Link
              to={`/schedules/${encodeURIComponent(semester)}/free-rooms`}
              className="flex items-center px-4 py-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-primary/10 mr-2">
                <Home className="h-4 w-4" />
              </div>
              <span className="font-medium">Free Rooms</span>
            </Link>
            <div className="h-8 w-px bg-border/50" />
            <Link
              to={`/schedules/${encodeURIComponent(
                semester
              )}/regenerateSchedule`}
              className="flex items-center px-4 py-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-primary/10 mr-2">
                <RefreshCw className="h-4 w-4" />
              </div>
              <span className="font-medium">Reschedule Activities</span>
            </Link>
            <div className="h-8 w-px bg-border/50" />
            <Link
              to={`/schedules/${encodeURIComponent(semester)}/stats`}
              className="flex items-center px-4 py-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-primary/10 mr-2">
                <BarChart2 className="h-4 w-4" />
              </div>
              <span className="font-medium">Schedule Statistics</span>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Schedules for {decodedSemester}</CardTitle>
          </CardHeader>
          <CardContent className="flex space-x-4 justify-between">
            <Button
              onClick={handleExport}
              disabled={
                exportLoading || !allSchedules || loading || timeslotsLoading
              }
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
    </DashboardLayout>
  );
};

export default ScheduleTable;
