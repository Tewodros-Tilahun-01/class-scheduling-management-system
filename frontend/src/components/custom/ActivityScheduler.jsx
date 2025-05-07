import React, { useState, useEffect } from "react";
import {
  fetchCourses,
  fetchInstructors,
  fetchRoomTypes,
  addActivity,
  fetchActivities,
  fetchStudentGroups,
  generateSchedule,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

const ActivityScheduler = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activityForm, setActivityForm] = useState({
    courseId: "",
    instructorId: "",
    totalDuration: "",
    split: "",
    studentGroup: "",
    roomRequirement: "",
  });
  const [semester, setSemester] = useState("");
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  // Predefined list of semesters from 2017 to 2027
  const semesters = [];
  for (let year = 2017; year <= 2027; year++) {
    semesters.push(`${year} semester 1`);
    semesters.push(`${year} semester 2`);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          coursesData,
          instructorsData,
          roomTypesData,
          activitiesData,
          studentGroupsData,
        ] = await Promise.all([
          fetchCourses(),
          fetchInstructors(),
          fetchRoomTypes(),
          fetchActivities().catch(() => []),
          fetchStudentGroups().catch(() => []),
        ]);

        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setInstructors(Array.isArray(instructorsData) ? instructorsData : []);
        setRoomTypes(Array.isArray(roomTypesData) ? roomTypesData : []);
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
        setStudentGroups(
          Array.isArray(studentGroupsData) ? studentGroupsData : []
        );
        setLoading(false);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to fetch data. Ensure backend is running at http://localhost:5000"
        );
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleActivityChange = (name, value) => {
    setActivityForm({ ...activityForm, [name]: value });
    setFormError(null); // Clear form error on input change
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    const {
      courseId,
      instructorId,
      totalDuration,
      split,
      studentGroup,
      roomRequirement,
    } = activityForm;

    // Validation
    if (
      !courseId ||
      !instructorId ||
      !totalDuration ||
      !split ||
      !studentGroup ||
      !semester
    ) {
      setFormError("Please fill all required fields, including semester");
      setFormLoading(false);
      return;
    }
    const totalDurationNum = Number(totalDuration);
    const splitNum = Number(split);
    if (isNaN(totalDurationNum) || totalDurationNum < 1) {
      setFormError("Total Duration must be a positive number");
      setFormLoading(false);
      return;
    }
    if (isNaN(splitNum) || splitNum < 1) {
      setFormError("Split must be a positive number");
      setFormLoading(false);
      return;
    }
    if (splitNum > totalDurationNum) {
      setFormError("Split cannot exceed Total Duration");
      setFormLoading(false);
      return;
    }

    try {
      await addActivity({
        course: courseId,
        instructor: instructorId,
        totalDuration: totalDurationNum,
        split: splitNum,
        studentGroup,
        roomRequirement,
        semester,
      });
      const activitiesData = await fetchActivities();
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      setActivityForm({
        courseId: "",
        instructorId: "",
        totalDuration: "",
        split: "",
        studentGroup: "",
        roomRequirement: "",
      });
      setFormLoading(false);
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
      setFormLoading(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!semester) {
      setFormError("Please select a semester to generate the schedule");
      return;
    }
    try {
      setFormLoading(true);
      await generateSchedule(semester);
      setFormLoading(false);
      navigate(`/schedules/${semester}`);
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
      setFormLoading(false);
    }
  };

  const renderActivityRow = (activity, index) => (
    <TableRow key={index}>
      <TableCell>
        {activity.course?.courseCode
          ? `${activity.course.courseCode} - ${activity.course.name}`
          : "N/A"}
      </TableCell>
      <TableCell>{activity.instructor?.name || "N/A"}</TableCell>
      <TableCell>
        {activity.studentGroup
          ? `${activity.studentGroup.department} Year ${activity.studentGroup.year} Section ${activity.studentGroup.section}`
          : "N/A"}
      </TableCell>
      <TableCell>{activity.roomRequirement || "N/A"}</TableCell>
      <TableCell>{activity.totalDuration || "N/A"} hours</TableCell>
      <TableCell>{activity.split || "N/A"} split</TableCell>
      <TableCell>{activity.semester || "N/A"}</TableCell>
    </TableRow>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchData();
          }}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Semester Dropdown and Generate Button */}
      <Card>
        <CardHeader>
          <CardTitle>Select Semester</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="semester">Semester</Label>
              <Select
                value={semester}
                onValueChange={(value) => setSemester(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem} value={sem}>
                      {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerateSchedule}
              className="bg-green-500 hover:bg-green-600 w-full md:w-auto"
              disabled={formLoading}
            >
              {formLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Generate Schedule"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleAddActivity} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseId">Course</Label>
                <Select
                  name="courseId"
                  value={activityForm.courseId}
                  onValueChange={(value) =>
                    handleActivityChange("courseId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No courses available
                      </SelectItem>
                    ) : (
                      courses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.courseCode} - {course.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructorId">Instructor</Label>
                <Select
                  name="instructorId"
                  value={activityForm.instructorId}
                  onValueChange={(value) =>
                    handleActivityChange("instructorId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No instructors available
                      </SelectItem>
                    ) : (
                      instructors.map((instructor) => (
                        <SelectItem key={instructor._id} value={instructor._id}>
                          {instructor.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalDuration">
                  Total Duration (hours/week)
                </Label>
                <Input
                  type="number"
                  name="totalDuration"
                  value={activityForm.totalDuration}
                  onChange={(e) =>
                    handleActivityChange("totalDuration", e.target.value)
                  }
                  min="1"
                  step="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="split">Number of Splits</Label>
                <Input
                  type="number"
                  name="split"
                  value={activityForm.split}
                  onChange={(e) =>
                    handleActivityChange("split", e.target.value)
                  }
                  min="1"
                  step="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentGroup">Student Group</Label>
                <Select
                  name="studentGroup"
                  value={activityForm.studentGroup}
                  onValueChange={(value) =>
                    handleActivityChange("studentGroup", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Student Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentGroups.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No student groups available
                      </SelectItem>
                    ) : (
                      studentGroups.map((group) => (
                        <SelectItem key={group._id} value={group._id}>
                          {`${group.department} Year ${group.year} Section ${group.section}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomRequirement">Room Requirement</Label>
                <Select
                  name="roomRequirement"
                  value={activityForm.roomRequirement}
                  onValueChange={(value) =>
                    handleActivityChange("roomRequirement", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Room Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No room types available
                      </SelectItem>
                    ) : (
                      roomTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={formLoading}
              >
                {formLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add Activity"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Display Added Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Added Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {activities && activities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Student Group</TableHead>
                  <TableHead>Room Requirement</TableHead>
                  <TableHead>Total Duration</TableHead>
                  <TableHead>Split</TableHead>
                  <TableHead>Semester</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity, index) =>
                  renderActivityRow(activity, index)
                )}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No activities added yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityScheduler;
