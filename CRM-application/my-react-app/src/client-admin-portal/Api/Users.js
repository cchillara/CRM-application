import api from './client';

export const getUsers = async () => api.get('/users');
export const createUser = async (userData) => api.post('/users', userData);

export default { getUsers, createUser };
