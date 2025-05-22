import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  fetchSingleLectureSchedule,
  fetchAllLectureSchedules,
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

const LectureSchedule = () => {
  const { semester } = useParams();
  const [lectureId, setLectureId] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [allLectureSchedules, setAllLectureSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
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
    if (!lectureId) {
      toast.error("Please enter a lecture ID");
      return;
    }

    try {
      setLoading(true);
      const data = await fetchSingleLectureSchedule(semester, lectureId);
      setSchedules(data);
      toast.success("Lecture schedule loaded successfully");
    } catch (error) {
      toast.error("Failed to load lecture schedule", {
        description: error.message,
      });
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const renderScheduleTable = (scheduleData) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Course</TableHead>
          <TableHead>Lecture</TableHead>
          <TableHead>Student Group</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scheduleData.map((schedule) => (
          <TableRow key={schedule._id}>
            <TableCell>
              {schedule.activity.course.courseCode} -{" "}
              {schedule.activity.course.name}
            </TableCell>
            <TableCell>{schedule.activity.lecture.name}</TableCell>
            <TableCell>
              {schedule.activity.studentGroup.department} Year{" "}
              {schedule.activity.studentGroup.year} Section{" "}
              {schedule.activity.studentGroup.section}
            </TableCell>
            <TableCell>{schedule.room.name}</TableCell>
            <TableCell>
              {schedule.reservedTimeslots.map((ts) => (
                <div key={ts._id}>
                  {ts.day} {ts.startTime}-{ts.endTime}
                </div>
              ))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderLoadingSpinner = () => (
    <div className="flex justify-center items-center h-24">
      <svg className="animate-spin h-8 w-8 text-gray-500" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
        />
      </svg>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="container p-8">
        <Card>
          <CardHeader>
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
                    placeholder="Enter Lecture ID"
                    value={lectureId}
                    onChange={(e) => setLectureId(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button onClick={handleSearch} disabled={loading}>
                    Search
                  </Button>
                </div>

                {loading ? (
                  renderLoadingSpinner()
                ) : schedules.length > 0 ? (
                  renderScheduleTable(schedules)
                ) : (
                  <p className="text-muted-foreground">No schedules found.</p>
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
                          <CardHeader>
                            <CardTitle>
                              Lecture: {lectureData.name} (Max Load:{" "}
                              {lectureData.maxLoad})
                            </CardTitle>
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
