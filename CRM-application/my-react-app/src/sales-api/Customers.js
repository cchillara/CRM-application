import api from "./client.js";

export const getCustomers = async (scope) => {
  const url = scope === "mine" ? "/customers?scope=mine" : "/customers";
  return await api.get(url);
};

export const getCustomerById = async (id) => {
  return await api.get(`/customers/${id}`);
};

export const createCustomer = async (customerData) => {
  return await api.post("/customers", customerData);
};

export const updateCustomer = async (id, customerData) => {
  return await api.patch(`/customers/${id}`, customerData);
};

export const deleteCustomer = async (id) => {
  return await api.delete(`/customers/${id}`);
};

export default {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};

