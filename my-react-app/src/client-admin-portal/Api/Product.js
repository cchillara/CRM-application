import api from './client';

export const getProducts = async () => {
  return await api.get('/products');
};

export const createProduct = async (productData) => {
  return await api.post('/products', productData);
};

export const updateProduct = async (id, productData) => {
  return await api.patch(`/products/${id}`, productData);
};

export const deleteProduct = async (id) => {
  return await api.delete(`/products/${id}`);
};

export default {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
