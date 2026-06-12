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

export const importCsv = async (formData) => {
  const response = await axiosClient.post('/api/jobs/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getAnalytics = async () => {
  const response = await axiosClient.get('/api/analytics');
  return response.data;
};

export const searchJobs = async (params = {}) => {
  const response = await axiosClient.get('/api/search', { params });
  return response.data;
};

export const getCompanies = async (params = {}) => {
  const response = await axiosClient.get('/api/companies', { params });
  return response.data;
};

export const getResumes = async (params = {}) => {
  const response = await axiosClient.get('/api/resumes', { params });
  return response.data;
};

export const uploadResumeDirect = async (formData) => {
  const response = await axiosClient.post('/api/resumes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteResume = async (id) => {
  const response = await axiosClient.delete(`/api/resumes/${id}`);
  return response.data;
};

export const renameResume = async (id, name) => {
  const response = await axiosClient.put(`/api/resumes/${id}`, { name });
  return response.data;
};

export const getActivityLogs = async (params = {}) => {
  const response = await axiosClient.get('/api/activity-logs', { params });
  return response.data;
};
