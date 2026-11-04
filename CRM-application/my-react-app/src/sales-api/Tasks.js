import api from "./client.js";

export const getTasks = async () => {
  return await api.get("/tasks");
};

export const createTask = async (taskData) => {
  return await api.post("/tasks", taskData);
};

export const updateTask = async (id, taskData) => {
  return await api.patch(`/tasks/${id}`, taskData);
};

export const updateTaskStatus = async (id, status) => {
  return await api.patch(`/tasks/${id}/status`, { status });
};

export const deleteTask = async (id) => {
  return await api.delete(`/tasks/${id}`);
};

export default {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};

