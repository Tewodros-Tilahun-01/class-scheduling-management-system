import axios from "axios";

const api = axios.create({
  baseURL: "https://api.example.com",
  headers: { "Content-Type": "application/json" },
});

export const fetchSchedules = async () => {
//   const response = await api.get("/schedules");
  return response.data;
};

export default api;
