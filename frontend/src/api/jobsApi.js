import axiosClient from './axiosClient.js';

export const getJobs = async (params = {}) => {
  const response = await axiosClient.get('/api/jobs', { params });
  return response.data;
};

export const createJob = async (data) => {
  const response = await axiosClient.post('/api/jobs', data);
  return response.data;
};

export const updateJob = async (id, data) => {
  const response = await axiosClient.put(`/api/jobs/${id}`, data);
  return response.data;
};

export const deleteJob = async (id) => {
  await axiosClient.delete(`/api/jobs/${id}`);
};

export const uploadResume = async (id, formData) => {
  const response = await axiosClient.post(`/api/jobs/${id}/resume`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getStatsSummary = async () => {
  const response = await axiosClient.get('/api/jobs/stats/summary');
  return response.data;
};

export const getStatsMonthly = async () => {
  const response = await axiosClient.get('/api/jobs/stats/monthly');
  return response.data;
};

export const exportCsv = async (params = {}) => {
  const response = await axiosClient.get('/api/jobs/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};


