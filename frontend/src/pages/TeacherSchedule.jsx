import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchTeacherSchedule } from "@/services/api";
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

const TeacherSchedule = () => {
  const { semester } = useParams();
  const [teacherId, setTeacherId] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!teacherId) {
      toast.error("Please enter a teacher ID");
      return;
    }

    try {
      setLoading(true);
      const data = await fetchTeacherSchedule(semester, teacherId);
      setSchedules(data);
      toast.success("Teacher schedule loaded successfully");
    } catch (error) {
      toast.error("Failed to load teacher schedule", {
        description: error.message,
      });
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container p-8">
        <Card>
          <CardHeader>
            <CardTitle>Teacher Schedule - {decodeURIComponent(semester)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Enter Teacher ID"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handleSearch} disabled={loading}>
                Search
              </Button>
            </div>

            {loading ? (
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
            ) : schedules.length > 0 ? (
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
                  {schedules.map((schedule) => (
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
            ) : (
              <p className="text-muted-foreground">No schedules found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherSchedule; 