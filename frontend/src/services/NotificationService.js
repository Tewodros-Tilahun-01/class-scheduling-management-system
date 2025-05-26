import { api } from "./api";

const getNotifications = async (userId) => {
  const response = await api.get(`/users/notifications/${userId}`);
  return response.data;
};

export { getNotifications };
