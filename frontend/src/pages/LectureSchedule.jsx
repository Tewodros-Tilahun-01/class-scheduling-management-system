import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchAllLectureSchedules,
  exportLectureSchedule,
  searchLecturesByName,
} from "@/services/api";
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
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";
import { Clock, Users, Home, ArrowLeft } from "lucide-react";

const LectureSchedule = () => {
  const { semester } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [allLectureSchedules, setAllLectureSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("single");

  useEffect(() => {
    if (activeTab === "all") {
      loadAllLectureSchedules();
    }
  }, [activeTab]);

  const loadAllLectureSchedules = async () => {
    try {
      setLoadingAll(true);
      const data = await fetchAllLectureSchedules(semester);
      setAllLectureSchedules(data);
      if (Object.keys(data).length === 0) {
        toast.error("No lecture schedules found");
      } else {
        toast.success("All lecture schedules loaded successfully");
      }
    } catch (error) {
      toast.error("Failed to load all lecture schedules", {
        description: error.message,
      });
      setAllLectureSchedules({});
    } finally {
      setLoadingAll(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error("Please enter a lecture name");
      return;
    }

    try {
      setLoading(true);
      const results = await searchLecturesByName(semester, searchTerm);

      // Convert the object format to array format for easier rendering
      const resultsArray = Object.entries(results).map(([id, data]) => ({
        id,
        ...data,
      }));
      setSearchResults(resultsArray);

      if (resultsArray.length === 1) {
        // If only one result, show its schedules directly
        setSchedules(resultsArray[0].schedules);
      } else {
        // If multiple results, clear the schedules to show the selection UI
        setSchedules([]);
      }

      toast.success(
        resultsArray.length === 1
          ? "Lecture schedule loaded successfully"
          : `Found ${resultsArray.length} matching lectures`
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "An unknown error occurred";
      toast.error("Failed to search lectures", {
        description: errorMessage,
      });
      setSearchResults([]);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const selectLecture = (lectureSchedules) => {
    setSchedules(lectureSchedules);
    toast.success("Lecture schedule loaded successfully");
  };

  const handleExport = async (lectureId, lectureName) => {
    if (!lectureId) {
      toast.error("No lecture ID available for export");
      return;
    }

    try {
      setExportLoading(true);
      const data = await exportLectureSchedule(
        decodeURIComponent(semester),
        lectureId
      );
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      saveAs(
        blob,
        `Schedule_${semester.replace(/\s/g, "_")}_${lectureName.replace(
          /\s/g,
          "_"
        )}.docx`
      );
      toast.success("Schedule exported successfully", {
        description: `Downloaded schedule for ${lectureName}`,
      });
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export schedule", {
        description: err.message || "Unknown error occurred",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Helper function to convert time to minutes for sorting
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to get the earliest timeslot for a schedule
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

  // Helper function to sort schedules by day and time
  const sortSchedules = (schedules) => {
    const dayOrder = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };

    return [...schedules].sort((a, b) => {
      // First sort by day
      const dayA = a.reservedTimeslots[0]?.day;
      const dayB = b.reservedTimeslots[0]?.day;
      const dayDiff = (dayOrder[dayA] || 0) - (dayOrder[dayB] || 0);

      if (dayDiff !== 0) return dayDiff;

      // Then sort by time
      return getEarliestTime(a) - getEarliestTime(b);
    });
  };

  const getScheduleTimeRange = (schedule) => {
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

  const renderSearchResults = () => {
    if (!searchResults.length) return null;

    return (
      <div className="space-y-4 mt-4">
        <h3 className="text-lg font-semibold">Found Lectures:</h3>
        <div className="grid gap-4">
          {searchResults.map((result) => (
            <Card key={result.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {result.name} (Max Load: {result.maxLoad})
                  </span>
                  <Button
                    onClick={() => selectLecture(result.schedules)}
                    variant="secondary"
                  >
                    View Schedule
                  </Button>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderScheduleTable = (scheduleData) => (
    <Table className="border border-black">
      <TableHeader>
        <TableRow className="border border-black">
          <TableHead className="border border-black">Course</TableHead>
          <TableHead className="border border-black">Lecture</TableHead>
          <TableHead className="border border-black">Student Group</TableHead>
          <TableHead className="border border-black">Room</TableHead>
          <TableHead className="border border-black">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortSchedules(scheduleData).map((schedule) => (
          <TableRow key={schedule._id} className="border border-black">
            <TableCell className="border border-black">
              {schedule.activity.course.courseCode} -{" "}
              {schedule.activity.course.name}
            </TableCell>
            <TableCell className="border border-black">
              {schedule.activity.lecture.name}
            </TableCell>
            <TableCell className="border border-black">
              {schedule.activity.studentGroup.department} Year{" "}
              {schedule.activity.studentGroup.year} Section{" "}
              {schedule.activity.studentGroup.section}
            </TableCell>
            <TableCell className="border border-black">
              {schedule.room.name}
            </TableCell>
            <TableCell className="border border-black">
              {getScheduleTimeRange(schedule)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderLoadingSpinner = () => (
    <div className="flex justify-center items-center h-24">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="container p-8">
        {/* Navigation Links */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 mb-6">
          <div className="flex items-center gap-6">
            <Link
              to={`/schedules/${semester}`}
              className="flex items-center px-4 py-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-primary/10 mr-2">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="font-medium">Schedule</span>
            </Link>
            <div className="h-8 w-px bg-border/50" />
            <Link
              to={`/schedules/${semester}/free-rooms`}
              className="flex items-center px-4 py-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-primary/10 mr-2">
                <Home className="h-4 w-4" />
              </div>
              <span className="font-medium">Free Rooms</span>
            </Link>
            <div className="h-8 w-px bg-border/50" />
            <Link
              to={`/schedules/${semester}/regenerateSchedule`}
              className="flex items-center px-4 py-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-primary/10 mr-2">
                <Clock className="h-4 w-4" />
              </div>
              <span className="font-medium">Reschedule</span>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-">
            <CardTitle>
              Lecture Schedules - {decodeURIComponent(semester)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="single">Single Lecture</TabsTrigger>
                <TabsTrigger value="all">All Lectures</TabsTrigger>
              </TabsList>

              <TabsContent value="single">
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Enter Lecture Name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button onClick={handleSearch} disabled={loading}>
                    Search
                  </Button>
                </div>

                {loading ? (
                  renderLoadingSpinner()
                ) : schedules.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button
                        onClick={() =>
                          handleExport(
                            schedules[0].activity.lecture._id,
                            schedules[0].activity.lecture.name
                          )
                        }
                        disabled={exportLoading || !schedules.length}
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
                    </div>
                    {renderScheduleTable(schedules)}
                  </div>
                ) : (
                  renderSearchResults() || (
                    <p className="text-muted-foreground">
                      Enter a lecture name to search schedules.
                    </p>
                  )
                )}
              </TabsContent>

              <TabsContent value="all">
                {loadingAll ? (
                  renderLoadingSpinner()
                ) : Object.keys(allLectureSchedules).length > 0 ? (
                  <div className="space-y-8">
                    {Object.entries(allLectureSchedules).map(
                      ([lectureId, lectureData]) => (
                        <Card key={lectureId}>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>
                              Lecture: {lectureData.name} (Max Load:{" "}
                              {lectureData.maxLoad})
                            </CardTitle>
                            <Button
                              onClick={() =>
                                handleExport(lectureId, lectureData.name)
                              }
                              disabled={exportLoading}
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
                          </CardHeader>
                          <CardContent>
                            {renderScheduleTable(lectureData.schedules)}
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No lecture schedules found.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LectureSchedule;
