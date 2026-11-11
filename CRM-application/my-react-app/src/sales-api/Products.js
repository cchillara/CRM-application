import api from "./client.js";

export const getProducts = async () => {
  return await api.get("/products");
};

export const getProductById = async (id) => {
  return await api.get(`/products/${id}`);
};

export const createProduct = async (productData) => {
  return await api.post("/products", productData);
};

export const updateProduct = async (id, productData) => {
  return await api.patch(`/products/${id}`, productData);
};

export const deleteProduct = async (id) => {
  return await api.delete(`/products/${id}`);
};

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

