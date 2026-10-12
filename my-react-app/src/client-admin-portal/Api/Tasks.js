import api from './client';

export const getTasks = async () => {
  return await api.get('/tasks');
};

export const createTask = async (taskData) => {
  return await api.post('/tasks', taskData);
};

export const updateTask = async (id, taskData) => {
  return await api.patch(`/tasks/${id}`, taskData);
};

export const deleteTask = async (id) => {
  return await api.delete(`/tasks/${id}`);
};

export default {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
