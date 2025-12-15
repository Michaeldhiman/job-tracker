import axiosClient from './axiosClient.js';

export const login = async (credentials) => {
  const response = await axiosClient.post('/api/auth/login', credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await axiosClient.post('/api/auth/register', userData);
  return response.data;
};

