import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Add this
});

// Existing API functions (schedules, semesters, courses, etc.) remain unchanged
export const fetchSchedules = async ({ semester } = {}) => {
  const url = semester
    ? `/schedules/${encodeURIComponent(semester)}`
    : "/schedules?groupByStudentGroup=true";
  const response = await api.get(url);
  return response.data;
};

export const fetchSemesters = async () => {
  const response = await api.get("/schedules/semesters");
  return response.data;
};

export const generateSchedule = async (semester) => {
  const response = await api.post("/schedules/generate", { semester });
  return response.data;
};

export const fetchCourses = async () => {
  const response = await api.get("/courses");
  return response.data;
};

export const addCourse = async (courseData) => {
  const response = await api.post("/courses", courseData);
  return response.data;
};

export const updateCourse = async (id, courseData) => {
  const response = await api.put(`/courses/${id}`, courseData);
  return response.data;
};

export const deleteCourse = async (id) => {
  const response = await api.delete(`/courses/${id}`);
  return response.data;
};

export const fetchLectures = async () => {
  const response = await api.get("/lectures");
  return response.data;
};

export const addLecture = async (lectureData) => {
  const response = await api.post("/lectures", lectureData);
  return response.data;
};

export const updateLecture = async (id, lectureData) => {
  const response = await api.put(`/lectures/${id}`, lectureData);
  return response.data;
};

export const deleteLecture = async (id) => {
  const response = await api.delete(`/lectures/${id}`);
  return response.data;
};

export const fetchRooms = async () => {
  const response = await api.get("/rooms");
  return response.data;
};

export const fetchRoomTypes = async () => {
  const response = await api.get("/rooms/room-types");
  return response.data;
};

export const addRoom = async (roomData) => {
  const response = await api.post("/rooms", roomData);
  return response.data;
};

export const updateRoom = async (id, roomData) => {
  const response = await api.put(`/rooms/${id}`, roomData);
  return response.data;
};

export const deleteRoom = async (id) => {
  const response = await api.delete(`/rooms/${id}`);
  return response.data;
};

export const addActivity = async (activityData) => {
  const response = await api.post("/activities", activityData);
  return response.data;
};

export const fetchActivities = async ({ semester } = {}) => {
  const params = semester ? { semester } : {};
  const response = await api.get("/activities", { params });
  return response.data;
};

export const deleteActivity = async (id) => {
  const response = await api.delete(`/activities/${id}`);
  return response.data;
};

export const fetchStudentGroups = async () => {
  const response = await api.get("/studentGroups");
  return response.data;
};

export const addStudentGroup = async (studentGroupData) => {
  const response = await api.post("/studentGroups", studentGroupData);
  return response.data;
};

export const updateStudentGroup = async (id, studentGroupData) => {
  const response = await api.put(`/studentGroups/${id}`, studentGroupData);
  return response.data;
};

export const deleteStudentGroup = async (id) => {
  const response = await api.delete(`/studentGroups/${id}`);
  return response.data;
};

// New Timeslot API functions
export const fetchTimeslots = async () => {
  const response = await api.get("/timeslots");
  return response.data;
};

export const addTimeslot = async (timeslotData) => {
  const response = await api.post("/timeslots", timeslotData);
  return response.data;
};

export const updateTimeslot = async (id, timeslotData) => {
  const response = await api.put(`/timeslots/${id}`, timeslotData);
  return response.data;
};

export const deleteTimeslot = async (id) => {
  const response = await api.delete(`/timeslots/${id}`);
  return response.data;
};

export const exportSchedule = async (semester) => {
  const response = await api.get(
    `/schedules/${encodeURIComponent(semester)}/export`,
    { responseType: "blob" }
  );
  return response.data;
};

export const fetchSingleLectureSchedule = async (semester, lectureId) => {
  const response = await api.get(
    `/schedules/${encodeURIComponent(semester)}/lecture/${lectureId}`
  );
  return response.data;
};

export const fetchFreeRooms = async (semester, day, timeslot) => {
  const response = await api.get(
    `/schedules/${encodeURIComponent(semester)}/free-rooms`,
    {
      params: { day, timeslot },
    }
  );
  return response.data;
};

export const fetchAllLectureSchedules = async (semester) => {
  const response = await api.get(
    `/schedules/${encodeURIComponent(semester)}/lectures/all`
  );
  return response.data;
};

export default api;
