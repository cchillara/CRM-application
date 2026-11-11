import api from "./client.js";

export const getAnalytics = async () => {
  return await api.get("/analytics");
};

export default {
  getAnalytics,
};

