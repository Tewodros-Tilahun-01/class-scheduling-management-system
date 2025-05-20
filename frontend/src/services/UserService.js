import axios from "axios";

const API_Url = import.meta.env.VITE_API_URL;
export async function fetchUsers() {
  const res = await axios.get(`${API_Url}/api/users`);
  return res.data;
}
export async function addUser(user) {
  const res = await axios.post(`${API_Url}/api/users`, user);
  return res.data;
}
export async function updateUser(id, user) {
  const res = await axios.put(`${API_Url}/api/users/${id}`, user);
  return res.data;
}
export async function deleteUser(userId) {
  const res = await axios.delete(`${API_Url}/api/users/${userId}`);
  return res.data;
}
export async function getRepresentatives() {
  const res = await axios.get(`${API_Url}/api/admin/getRepresentatives`, {
    withCredentials: true,
  });
  return res.data;
}
export async function addRepresentative(representative) {
  const res = await axios.post(
    `${API_Url}/api/admin/addRepresentative`,
    representative,
    { withCredentials: true }
  );
  return res.data;
}

export async function getPersonalInfo(id) {
  console.log("user id :", id);
  const res = await axios.get(`${API_Url}/api/users/personalinfo/${id}`, {
    withCredentials: true,
  });
  console.log("from api service", res.data);
  return res.data;
}
