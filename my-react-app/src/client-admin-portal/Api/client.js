
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1/client-admin';

export const getAuthToken = async () => {
  if (typeof window !== 'undefined' && window.auth?.currentUser) {
    try {
      const freshToken = await window.auth.currentUser.getIdToken();
      if (freshToken) {
        localStorage.setItem('token', freshToken);
        return freshToken;
      }
    } catch (e) {

    }
  }
  return localStorage.getItem('token') || localStorage.getItem('firebaseToken') || '';
};

export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = result?.message || result?.errors?.[0]?.message || `HTTP ${response.status}: Request failed`;
      throw new Error(errorMessage);
    }

    return result?.data !== undefined ? result.data : result;
  } catch (error) {
    console.error(`[CRM API Error] ${options.method || 'GET'} ${url}:`, error.message);
    throw error;
  }
}

export default {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
