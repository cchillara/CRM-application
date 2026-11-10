import api from './client';

export const getDashboard = async () => {
  return await api.get('/dashboard');
};

export const exportReport = async () => {
  return await api.get('/export-report');
};

export default {
  getDashboard,
  exportReport,
};
