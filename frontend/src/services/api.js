import axios from "axios";

export const api = axios.create({
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
  try {
    const response = await api.post("/schedules/generate", { semester });
    return response.data; // Returns { message, workerId }
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
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

export const fetchRoomTypes = async ({ active } = {}) => {
  const response = await api.get("/rooms/room-types", {
    params: { active },
  });
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

export const exportLectureSchedule = async (semester, lectureId) => {
  if (!semester || !lectureId) {
    throw new Error("Semester and lecture ID are required");
  }

  try {
    const response = await api.get(
      `/schedules/${encodeURIComponent(semester)}/lecture/${lectureId}/export`,
      {
        responseType: "blob",
        headers: {
          Accept:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      try {
        const parsed = JSON.parse(text);
        throw new Error(parsed.error || "Export failed");
      } catch (e) {
        throw new Error("Failed to export schedule");
      }
    }
    throw error;
  }
};

export const fetchFreeRooms = async (semester, day, timeslot) => {
  const response = await api.get(
    `/rooms/${encodeURIComponent(semester)}/free-rooms`,
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

export const searchLecturesSchduleByName = async (semester, name) => {
  try {
    const response = await api.get(
      `/schedules/${encodeURIComponent(semester)}/lectures/search`,
      { params: { name } }
    );
    return response.data;
  } catch (error) {
    // If the error has a response with data, use that error message
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    // Otherwise, throw the original error
    throw error;
  }
};

export const regenerateSchedule = async (semester, activityIds) => {
  try {
    const response = await api.post(`/schedules/regenerateSchedule`, {
      activityIds,
      semester,
    });
    return response.data; // Returns { workerId }
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

export const fetchScheduledActivities = async (semester) => {
  try {
    const response = await api.get(
      `/schedules/${encodeURIComponent(semester)}/scheduled-activities`
    );
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

export const fetchDashboardStats = async () => {
  try {
    const response = await api.get("/general/stats");
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

export const deleteSchedule = async (semester) => {
  try {
    const response = await api.delete(`/schedules/${semester}`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

export const fetchActivityStats = async (semester) => {
  try {
    const response = await api.get(
      `/activities/${encodeURIComponent(semester)}/stats`
    );
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

export const checkScheduleStatus = async (workerId) => {
  try {
    const response = await api.get(`/schedules/status/${workerId}`);
    return response.data; // Returns { status, progress, result, error }
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

export const fetchBuildings = async () => {
  const response = await api.get("/buildings");
  return response.data;
};

export const fetchBuildingById = async (id) => {
  const response = await api.get(`/buildings/${id}`);
  return response.data;
};

export const addBuilding = async (buildingData) => {
  const response = await api.post("/buildings", buildingData);
  return response.data;
};

export const updateBuilding = async (id, buildingData) => {
  const response = await api.put(`/buildings/${id}`, buildingData);
  return response.data;
};

export const deleteBuilding = async (id) => {
  const response = await api.delete(`/buildings/${id}`);
  return response.data;
};

export const exportRoomReport = async (semester) => {
  try {
    const response = await api.get(
      `/rooms/${encodeURIComponent(semester)}/export-report`,
      {
        responseType: "blob",
        headers: {
          Accept:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      try {
        const parsed = JSON.parse(text);
        throw new Error(parsed.error || "Export failed");
      } catch (e) {
        throw new Error("Failed to export room report");
      }
    }
    throw error;
  }
};

export default api;
