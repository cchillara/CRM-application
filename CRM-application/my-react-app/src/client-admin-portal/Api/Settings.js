import api from './client';

export const getSettings = async () => {
  return await api.get('/settings');
};

export const updateSettings = async (settingsData) => {
  return await api.patch('/settings', settingsData);
};

export const getProfile = async () => {
  return await api.get('/profile');
}

export const updateProfile = async (profileData) => {
  return await api.patch('/profile', profileData);
};

export const updatePassword = async (token) => {
  return await api.patch('/password', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export default {
  getSettings,
  getProfile,
  updateSettings,
  updateProfile,
  updatePassword,
};
