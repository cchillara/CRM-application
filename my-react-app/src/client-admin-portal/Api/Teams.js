import api from './client';

export const getTeams = async () => {
  return await api.get('/team');
};

export const createTeam = async (teamData) => {
  return await api.post('/team', teamData);
};

export const updateTeam = async (id, teamData) => {
  return await api.patch(`/team/${id}`, teamData);
};

export const deleteTeam = async (id) => {
  return await api.delete(`/team/${id}`);
};

export default {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
};
