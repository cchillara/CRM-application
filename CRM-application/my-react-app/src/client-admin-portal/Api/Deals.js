import api from './client';

export const getDeals = async () => {
  return await api.get('/deals');
};

export const createDeal = async (dealData) => {
  return await api.post('/deals', dealData);
};

export const updateDeal = async (id, dealData) => {
  return await api.patch(`/deals/${id}`, dealData);
};

export const deleteDeal = async (id) => {
  return await api.delete(`/deals/${id}`);
};

export default {
  getDeals,
  createDeal,
  updateDeal,
  deleteDeal,
};
