import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Backend URL
  headers: { "Content-Type": "application/json" },
});

export const fetchSchedules = async () => {
  const response = await api.get("/schedule/all");
  return response.data;
};

export const fetchCourses = async () => {
  const response = await api.get("/data/courses");
  return response.data;
};

export const fetchInstructors = async () => {
  const response = await api.get("/data/instructors");
  return response.data;
};

export const fetchRoomTypes = async () => {
  const response = await api.get("/data/room-types");
  return response.data;
};

export const addActivity = async (activityData) => {
  const response = await api.post("/activities", activityData);
  return response.data;
};

export const fetchActivities = async () => {
  const response = await api.get("/activities");
  return response.data;
};

export const generateSchedule = async (semester) => {
  const response = await api.post("/schedule/generate", { semester });
  return response.data;
};

export const fetchStudentGroups = async () => {
  const response = await api.get("/student-groups");
  return response.data;
};

export const addStudentGroup = async (studentGroupData) => {
  const response = await api.post("/student-groups", studentGroupData);
  return response.data;
};

export const updateStudentGroup = async (id, studentGroupData) => {
  const response = await api.put(`/student-groups/${id}`, studentGroupData);
  return response.data;
};

export const deleteStudentGroup = async (id) => {
  const response = await api.delete(`/student-groups/${id}`);
  return response.data;
};

export default api;
