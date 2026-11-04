import api from './client';

export const getEmployees = async () => {
  return await api.get('/employee');
};

export const createEmployee = async (employeeData) => {
  return await api.post('/employee', employeeData);
};

export const updateEmployee = async (id, employeeData) => {
  return await api.patch(`/employee/${id}`, employeeData);
};

export const deleteEmployee = async (id) => {
  return await api.delete(`/employee/${id}`);
};

export default {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
