import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Update with your actual backend URL
  headers: { "Content-Type": "application/json" },
});

export const fetchSchedules = async () => {
  const response = await api.get("/schedule/all");
  return response.data;
};

export default api;
