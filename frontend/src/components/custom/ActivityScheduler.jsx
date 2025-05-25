import React, { useState, useEffect } from "react";
import {
  fetchCourses,
  fetchLectures,
  fetchRoomTypes,
  addActivity,
  fetchActivities,
  fetchStudentGroups,
  generateSchedule,
  deleteActivity,
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
import { BarChart3, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ActivityList Component
const ActivityList = ({
  activities,
  semester,
  courses,
  lectures,
  studentGroups,
  onDeleteActivity,
  loading,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState(null);

  const handleDeleteActivity = async (id) => {
    try {
      await onDeleteActivity(id);
      setDialogOpen(false);
    } catch (err) {
      console.log(err);
    }
  };

  const renderActivityRow = (activity, index) => {
    const course = courses.find((c) => c._id === activity.course);
    const lecture = lectures.find((i) => i._id === activity.lecture);
    const studentGroup = studentGroups.find(
      (g) => g._id === activity.studentGroup
    );

    return (
      <TableRow key={activity._id || index}>
        <TableCell>
          {course ? `${course.courseCode} - ${course.name}` : "N/A"}
        </TableCell>
        <TableCell>{lecture ? lecture.name : "N/A"}</TableCell>
        <TableCell>
          {studentGroup
            ? `${studentGroup.department} Year ${studentGroup.year} Section ${studentGroup.section}`
            : "N/A"}
        </TableCell>
        <TableCell>{activity.roomRequirement || "N/A"}</TableCell>
        <TableCell>{activity.totalDuration || "N/A"} hours</TableCell>
        <TableCell>{activity.split || "N/A"} split</TableCell>
        <TableCell>{activity.semester || "N/A"}</TableCell>
        <TableCell>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={loading}
                onClick={() => setSelectedActivityId(activity._id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this activity? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={loading}
                >
                  No
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteActivity(selectedActivityId)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Yes"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TableCell>
      </TableRow>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return semester && activities && activities.length > 0 ? (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Course</TableHead>
          <TableHead>lecture</TableHead>
          <TableHead>Student Group</TableHead>
          <TableHead>Room Requirement</TableHead>
          <TableHead>Total Duration</TableHead>
          <TableHead>Split</TableHead>
          <TableHead>Semester</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activities.map((activity, index) =>
          renderActivityRow(activity, index)
        )}
      </TableBody>
    </Table>
  ) : (
    <p className="text-muted-foreground">
      {semester
        ? "No activities added yet for this semester."
        : "Please select a semester to view activities."}
    </p>
  );
};

const ActivityScheduler = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activityForm, setActivityForm] = useState({
    courseId: "",
    lectureId: "",
    totalDuration: "",
    split: "",
    studentGroup: "",
    roomRequirement: "",
  });
  const [semester, setSemester] = useState("");
  const [loadingData, setLoadingData] = useState(true); // Loading state for initial data
  const [loadingActivities, setLoadingActivities] = useState(false); // Loading state for activities
  const [formLoading, setFormLoading] = useState(false);

  // Predefined list of semesters from 2017 to 2027
  const semesters = [];
  for (let year = 2017; year <= 2027; year++) {
    semesters.push(`${year} semester 1`);
    semesters.push(`${year} semester 2`);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [coursesData, lecturesData, roomTypesData, studentGroupsData] =
          await Promise.all([
            fetchCourses(),
            fetchLectures(),
            fetchRoomTypes(),
            fetchStudentGroups(),
          ]);

        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setLectures(Array.isArray(lecturesData) ? lecturesData : []);
        setRoomTypes(Array.isArray(roomTypesData) ? roomTypesData : []);
        setStudentGroups(
          Array.isArray(studentGroupsData) ? studentGroupsData : []
        );
        toast.success("Data loaded successfully");
      } catch (err) {
        toast.error(
          err.response?.data?.error || err.message || "Failed to fetch data"
        );
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchSemesterActivities = async () => {
      if (semester) {
        try {
          setLoadingActivities(true);
          const activitiesData = await fetchActivities({ semester });
          setActivities(Array.isArray(activitiesData) ? activitiesData : []);
          toast.success("Activities loaded successfully", {
            description: `Fetched activities for ${semester}`,
          });
        } catch (err) {
          toast.error(
            err.response?.data?.error ||
              err.message ||
              "Failed to fetch activities",
            {
              description:
                "Unable to fetch activities for the selected semester",
            }
          );
        } finally {
          setLoadingActivities(false);
        }
      } else {
        setActivities([]);
      }
    };

    fetchSemesterActivities();
  }, [semester]);

  const handleActivityChange = (name, value) => {
    setActivityForm({ ...activityForm, [name]: value });
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    const {
      courseId,
      lectureId,
      totalDuration,
      split,
      studentGroup,
      roomRequirement,
    } = activityForm;

    if (
      !courseId ||
      !lectureId ||
      !totalDuration ||
      !split ||
      !studentGroup ||
      !semester
    ) {
      toast.error("Please fill all required fields", {
        description:
          "Course, lecture, total duration, split, student group, and semester are required",
      });
      setFormLoading(false);
      return;
    }
    const totalDurationNum = Number(totalDuration);
    const splitNum = Number(split);
    if (isNaN(totalDurationNum) || totalDurationNum < 1) {
      toast.error("Invalid Total Duration", {
        description: "Total Duration must be a positive number",
      });
      setFormLoading(false);
      return;
    }
    if (isNaN(splitNum) || splitNum < 1) {
      toast.error("Invalid Split", {
        description: "Split must be a positive number",
      });
      setFormLoading(false);
      return;
    }
    if (splitNum > totalDurationNum) {
      toast.error("Invalid Split", {
        description: "Split cannot exceed Total Duration",
      });
      setFormLoading(false);
      return;
    }

    try {
      await addActivity({
        course: courseId,
        lecture: lectureId,
        totalDuration: totalDurationNum,
        split: splitNum,
        studentGroup,
        roomRequirement,
        semester,
      });
      const activitiesData = await fetchActivities({ semester });
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      setActivityForm({
        courseId: "",
        lectureId: "",
        totalDuration: "",
        split: "",
        studentGroup: "",
        roomRequirement: "",
      });
      toast.success("Activity added successfully", {
        description: `Added activity for ${semester}`,
      });
    } catch (err) {
      toast.error(
        err.response?.data?.error || err.message || "Failed to add activity",
        {
          description: "Unable to add the activity",
        }
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteActivity = async (id) => {
    try {
      setLoadingActivities(true);
      await deleteActivity(id);
      const activitiesData = await fetchActivities({ semester });
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      toast.success("Activity deleted successfully", {
        description: `Removed activity from ${semester}`,
      });
    } catch (err) {
      toast.error(
        err.response?.data?.error || err.message || "Failed to delete activity",
        {
          description: "Unable to delete the activity",
        }
      );
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!semester) {
      toast.error("No semester selected", {
        description: "Please select a semester to generate the schedule",
      });
      return;
    }
    try {
      setFormLoading(true);
      await generateSchedule(semester);
      toast.success("Schedule generated successfully", {
        description: `Generated schedule for ${semester}`,
      });
      navigate(`/schedules/${semester}`);
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          err.message ||
          "Failed to generate schedule",
        {
          description: "Unable to generate the schedule",
        }
      );
    } finally {
      setFormLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto  space-y-8 w-full px-8 py-6">
      {loadingData ? (
        <div className="flex justify-center items-center h-24">
          <svg
            className="animate-spin h-8 w-8 text-gray-500"
            viewBox="0 0 24 24"
          >
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
      ) : (
        <>
          {/* Semester Dropdown and Generate Button */}
          <Card>
            <CardHeader>
              <CardTitle>Select Semester</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="semester-select">Semester</Label>
                  <Select
                    value={semester}
                    onValueChange={(value) => setSemester(value)}
                    disabled={loadingData}
                  >
                    <SelectTrigger id="semester-select">
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
                <div className="flex items-center justify-between">
                  <Button
                    onClick={handleGenerateSchedule}
                    className="bg-green-500 hover:bg-green-600 w-full md:w-auto"
                    disabled={formLoading || loadingData}
                  >
                    {formLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Generate Schedule"
                    )}
                  </Button>
                  {semester && (
                    <Link
                      to={`/activity/schedule-stats/${semester}`}
                      className="flex items-center shadow-md px-2 py-2 rounded-md bg-green-500 text-white"
                    >
                      <BarChart3 className="h-4 w-4 text-white" />
                      <p className="ml-2 capitalize text-white">statistics</p>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Creation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddActivity} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-select">Course</Label>
                    <Select
                      name="courseId"
                      value={activityForm.courseId}
                      onValueChange={(value) =>
                        handleActivityChange("courseId", value)
                      }
                    >
                      <SelectTrigger id="course-select">
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
                    <Label htmlFor="lecture-select">Lecture</Label>
                    <Select
                      name="lectureId"
                      value={activityForm.lectureId}
                      onValueChange={(value) =>
                        handleActivityChange("lectureId", value)
                      }
                    >
                      <SelectTrigger id="lecture-select">
                        <SelectValue placeholder="Select Lecture" />
                      </SelectTrigger>
                      <SelectContent>
                        {lectures.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No lectures available
                          </SelectItem>
                        ) : (
                          lectures.map((lecture) => (
                            <SelectItem key={lecture._id} value={lecture._id}>
                              {lecture.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total-duration">
                      Total Duration (hours/week)
                    </Label>
                    <Input
                      id="total-duration"
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
                    <Label htmlFor="split-input">Hour of Split</Label>
                    <Input
                      id="split-input"
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
                    <Label htmlFor="student-group-select">Student Group</Label>
                    <Select
                      name="studentGroup"
                      value={activityForm.studentGroup}
                      onValueChange={(value) =>
                        handleActivityChange("studentGroup", value)
                      }
                    >
                      <SelectTrigger id="student-group-select">
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
                    <Label htmlFor="room-type-select">Room Requirement</Label>
                    <Select
                      name="roomRequirement"
                      value={activityForm.roomRequirement}
                      onValueChange={(value) =>
                        handleActivityChange("roomRequirement", value)
                      }
                    >
                      <SelectTrigger id="room-type-select">
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

          {/* Activity List */}
          <Card>
            <CardHeader>
              <CardTitle>Added Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityList
                activities={activities}
                semester={semester}
                courses={courses}
                lectures={lectures}
                studentGroups={studentGroups}
                onDeleteActivity={handleDeleteActivity}
                loading={loadingActivities}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ActivityScheduler;
