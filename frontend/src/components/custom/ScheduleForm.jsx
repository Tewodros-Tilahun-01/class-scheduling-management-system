import React, { useState, useEffect } from "react";
import axios from "axios";

const ActivityScheduler = () => {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [activityForm, setActivityForm] = useState({
    courseId: "",
    instructorId: "",
    duration: "",
    studentGroup: "",
    roomRequirement: "",
    frequencyPerWeek: "1",
  });
  const [semester, setSemester] = useState(1);
  const [schedule, setSchedule] = useState(null);

  // Fetch dropdown data
  useEffect(() => {
    axios.get("/api/data/courses").then((res) => setCourses(res.data));
    axios.get("/api/data/instructors").then((res) => setInstructors(res.data));
    axios.get("/api/data/room-types").then((res) => setRoomTypes(res.data));
  }, []);

  // Handle activity form changes
  const handleActivityChange = (e) => {
    setActivityForm({ ...activityForm, [e.target.name]: e.target.value });
  };

  // Add activity
  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/activities", activityForm);
      alert("Activity added successfully!");
      // Reset form
      setActivityForm({
        courseId: "",
        instructorId: "",
        duration: "",
        studentGroup: "",
        roomRequirement: "",
        frequencyPerWeek: "1",
      });
    } catch (err) {
      alert(`Error: ${err.response.data.error}`);
    }
  };

  // Generate schedule
  const handleGenerateSchedule = async () => {
    try {
      const response = await axios.post("/api/schedule/generate", { semester });
      setSchedule(response.data);
      alert("Schedule generated successfully!");
    } catch (err) {
      alert(`Error: ${err.response.data.error}`);
    }
  };

  return (
    <div>
      {/* Activity Creation Form */}
      <h2>Add Activity</h2>
      <form onSubmit={handleAddActivity}>
        <label>Course:</label>
        <select
          name="courseId"
          value={activityForm.courseId}
          onChange={handleActivityChange}
        >
          <option value="">Select Course</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.name}
            </option>
          ))}
        </select>

        <label>Instructor:</label>
        <select
          name="instructorId"
          value={activityForm.instructorId}
          onChange={handleActivityChange}
        >
          <option value="">Select Instructor</option>
          {instructors.map((instructor) => (
            <option key={instructor._id} value={instructor._id}>
              {instructor.name}
            </option>
          ))}
        </select>

        <label>Duration (hours):</label>
        <input
          type="number"
          name="duration"
          value={activityForm.duration}
          onChange={handleActivityChange}
        />

        <label>Student Group:</label>
        <input
          type="text"
          name="studentGroup"
          value={activityForm.studentGroup}
          onChange={handleActivityChange}
        />

        <label>Room Requirement:</label>
        <select
          name="roomRequirement"
          value={activityForm.roomRequirement}
          onChange={handleActivityChange}
        >
          <option value="">Select Room Type</option>
          {roomTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <label>Frequency Per Week:</label>
        <input
          type="number"
          name="frequencyPerWeek"
          value={activityForm.frequencyPerWeek}
          onChange={handleActivityChange}
          min="1"
        />

        <button type="submit">Add Activity</button>
      </form>

      {/* Schedule Generation */}
      <h2>Generate Schedule</h2>
      <label>Semester:</label>
      <input
        type="number"
        value={semester}
        onChange={(e) => setSemester(Number(e.target.value))}
      />
      <button onClick={handleGenerateSchedule}>Generate Schedule</button>

      {/* Display Schedule */}
      {schedule && (
        <div>
          <h3>Generated Schedule</h3>
          <pre>{JSON.stringify(schedule, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ActivityScheduler;
