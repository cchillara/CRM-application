import api from "./client.js";

export const getProfile = async () => {
  return await api.get("/profile");
};

export const updateProfile = async (profileData) => {
  return await api.patch("/profile", profileData);
};

export default {
  getProfile,
  updateProfile,
};

