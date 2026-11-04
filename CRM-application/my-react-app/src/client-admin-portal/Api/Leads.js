import api from './client';


export const getLeads = async () => {
  return await api.get('/leads');
};

export const createLead = async (leadData) => {
  return await api.post('/leads', leadData);
};

export const updateLead = async (id, leadData) => {
  return await api.patch(`/leads/${id}`, leadData);
};

export const deleteLead = async (id) => {
  return await api.delete(`/leads/${id}`);
};

export default {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
};
