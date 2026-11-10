import api from './client';

export const getFollowUps = async (entityType, entityId) => {
  return await api.get(`/followups?entityType=${entityType}&entityId=${entityId}`);
};

export const createFollowUp = async (payload) => {
  return await api.post('/followups', payload);
};
export const updateFollowUp = async (id, payload) => {
  return await api.put(`/followups/${id}`, payload);
};

export const deleteFollowUp = async (id) => {
  return await api.delete(`/followups/${id}`);
};

export default { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp };
