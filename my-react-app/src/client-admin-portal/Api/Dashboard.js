import api from './client';

export const getDashboard = async () => {
  return await api.get('/dashboard');
};

export default {
  getDashboard,
};
