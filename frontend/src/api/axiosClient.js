import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
      const isOnLoginPage = window.location.pathname === '/login';

      if (!isAuthEndpoint && !isOnLoginPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?expired=1&redirect=${redirect}`;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
