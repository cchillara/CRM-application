import api from "./client.js";

export const getSettings = async () => {
  return await api.get("/settings");
};

export const updateSettings = async (settingsData) => {
  return await api.patch("/settings", settingsData);
};

export default {
  getSettings,
  updateSettings,
};

