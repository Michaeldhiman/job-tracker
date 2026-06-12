import axios from 'axios';
import { getLogoutHandler } from '../context/authState.js';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token to requests
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 errors and sync notifications on mutating requests
axiosClient.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase();
    const url = response.config.url;
    if (['POST', 'PUT', 'DELETE'].includes(method) && url && !url.includes('/api/auth')) {
      window.dispatchEvent(new CustomEvent('sync-notifications'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const logoutHandler = getLogoutHandler();

      if (logoutHandler) {
        logoutHandler();
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

