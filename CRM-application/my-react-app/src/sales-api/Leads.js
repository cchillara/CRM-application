import api from "./client.js";

export const getLeads = async () => {
  return await api.get("/leads");
};

export const getLeadById = async (id) => {
  return await api.get(`/leads/${id}`);
};

export const createLead = async (leadData) => {
  return await api.post("/leads", leadData);
};

export const updateLead = async (id, leadData) => {
  return await api.patch(`/leads/${id}`, leadData);
};

export const updateLeadStatus = async (id, status) => {
  return await api.patch(`/leads/${id}/status`, { status });
};

export const deleteLead = async (id) => {
  return await api.delete(`/leads/${id}`);
};

export const convertLead = async (id, payload) => {
  return await api.post(`/leads/${id}/convert`, payload);
};

export default {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  updateLeadStatus,
  deleteLead,
  convertLead,
};

