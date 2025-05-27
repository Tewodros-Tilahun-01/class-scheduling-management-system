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
import { Loader2, Users, Home, RefreshCw, Search } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LectureSchedules = () => {
  const { semester } = useParams();
  const decodedSemester = decodeURIComponent(semester);
  const [allSchedules, setAllSchedules] = useState(null);
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeslotsLoading, setTimeslotsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeslotsError, setTimeslotsError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

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

  // Get unique departments and years for filters
  const departments = React.useMemo(() => {
    if (!allSchedules) return [];
    return [
      ...new Set(
        Object.values(allSchedules)
          .filter((groupData) => groupData?.studentGroup?.department)
          .map((groupData) => groupData.studentGroup.department)
      ),
    ].sort();
  }, [allSchedules]);

  const years = React.useMemo(() => {
    if (!allSchedules) return [];
    return [
      ...new Set(
        Object.values(allSchedules)
          .filter((groupData) => groupData?.studentGroup?.year)
          .map((groupData) => groupData.studentGroup.year)
      ),
    ].sort();
  }, [allSchedules]);

  // Filter schedules based on search and filters
  const filteredSchedules = React.useMemo(() => {
    if (!allSchedules) return {};

    return Object.entries(allSchedules).reduce((acc, [key, groupData]) => {
      const studentGroup = groupData.studentGroup || {};
      const groupString =
        `${studentGroup.department} ${studentGroup.year} ${studentGroup.section}`.toLowerCase();

      const matchesSearch =
        searchQuery === "" || groupString.includes(searchQuery.toLowerCase());
      const matchesDepartment =
        departmentFilter === "all" ||
        studentGroup.department === departmentFilter;
      const matchesYear =
        yearFilter === "all" || studentGroup.year === yearFilter;

      if (matchesSearch && matchesDepartment && matchesYear) {
        acc[key] = groupData;
      }
      return acc;
    }, {});
  }, [allSchedules, searchQuery, departmentFilter, yearFilter]);

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

  // Helper: get sorted reserved timeslots for an entry
  const getSortedReservedTimeslots = (entry) => {
    if (!entry.reservedTimeslots || entry.reservedTimeslots.length === 0)
      return [];
    return [...entry.reservedTimeslots]
      .map((ts) => (typeof ts === "object" ? ts : timeslotMap[ts]))
      .filter(Boolean)
      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
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
          <Table className="border border-black">
            <TableHeader>
              <TableRow className="border border-black">
                <TableHead className="border border-black">Time</TableHead>
                {uniqueDays.map((day) => (
                  <TableHead key={day} className="border border-black">
                    {day}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const maxRows = Math.max(
                  ...uniqueDays.map((day) => dayTimeslots[day].length)
                );
                return Array.from({ length: maxRows }).map((_, rowIdx) => (
                  <TableRow
                    key={`row-${rowIdx}`}
                    className="border border-black"
                  >
                    <TableCell className="border border-black">
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
                    {uniqueDays.map((day) => {
                      const ts = dayTimeslots[day][rowIdx];
                      if (!ts)
                        return (
                          <TableCell
                            key={day}
                            className="border border-black"
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
                            className="border border-black"
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
                      return (
                        <TableCell key={day} className="border border-black">
                          <span className="flex justify-center">-</span>
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
              to={`/schedules/${encodeURIComponent(semester)}`}
              className="flex items-center px-4 py-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-primary/10 mr-2">
                <Users className="h-4 w-4" />
              </div>
              <span className="font-medium">All Schedules</span>
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
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lecture Schedules for {decodedSemester}</CardTitle>
          </CardHeader>
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
          <>
            {/* Search and Filter Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by department, year, or section..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select
                    value={departmentFilter}
                    onValueChange={setDepartmentFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          Year {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Quick Navigation Links */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {Object.values(filteredSchedules)
                    .filter((groupData) => groupData?.studentGroup)
                    .map((groupData) => {
                      const { department, year, section } =
                        groupData.studentGroup;
                      const id = `schedule-${department}-${year}-${section}`;
                      return (
                        <Button
                          key={id}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            document
                              .getElementById(id)
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          {department} Y{year} S{section}
                        </Button>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Schedule Tables */}
            {Object.values(filteredSchedules).length > 0 ? (
              Object.values(filteredSchedules)
                .filter(
                  (groupData) => groupData && Array.isArray(groupData.entries)
                )
                .map((groupData) => {
                  const { department, year, section } = groupData.studentGroup;
                  const id = `schedule-${department}-${year}-${section}`;
                  return (
                    <div key={id} id={id}>
                      {renderTimetable(groupData)}
                    </div>
                  );
                })
            ) : (
              <Card>
                <CardContent>
                  <p className="text-muted-foreground">
                    No schedules found matching your search criteria.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
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

export default LectureSchedules;
