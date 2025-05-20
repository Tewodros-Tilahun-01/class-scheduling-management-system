import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
export const loginUser = async (credentials) => {
  console.log("Logging in with credentials:", credentials);

  try {
    const response = await axios.post(
      `${API_URL}/api/auth/login`,
      credentials,
      {
        withCredentials: true, // Add this
        timeout: 8000,
      }
    );
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Login failed";
    throw new Error(message);
  }
};
export const getMe = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to fetch user data";
    throw new Error(message);
  }
};
