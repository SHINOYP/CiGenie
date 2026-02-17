import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

export const getProjects = async () => {
  const response = await axios.get(`${API_URL}/deploy/projects`);
  return response.data;
};

export const analyzeIntent = async (projectId, intent) => {
  const response = await axios.post(`${API_URL}/deploy/intent`, {
    projectId,
    ...intent
  });
  return response.data;
};

export const executePlan = async (plan) => {
  const response = await axios.post(`${API_URL}/deploy/execute`, { plan });
  return response.data;
};

export const getHistory = async () => {
  const response = await axios.get(`${API_URL}/deploy/history`);
  return response.data;
};

export const getExecution = async (id) => {
  const response = await axios.get(`${API_URL}/deploy/execution/${id}`);
  return response.data;
};

export const deleteProjectJob = async (projectId) => {
  const response = await axios.delete(`${API_URL}/deploy/${projectId}`);
  return response.data;
};
// Dashboard API calls
export const getDashboardStats = async () => {
  const response = await axios.get(`${API_URL}/system/stats`);
  return response.data;
};

export const getSystemStatus = async () => {
  const response = await axios.get(`${API_URL}/system/status`);
  return response.data;
};

export const getSystemRecommendations = async () => {
  const response = await axios.get(`${API_URL}/system/insights`);
  return response.data;
};

export const getLivePaths = () => axios.get(`${API_URL}/system/paths`).then(res => res.data);

export const syncJenkinsStatus = async () => {
  const response = await axios.post(`${API_URL}/deploy/sync-jenkins`);
  return response.data;
};

// Config
export const getConfig = async () => {
  const response = await axios.get(`${API_URL}/config`);
  return response.data;
};

export const updateConfig = async (config) => {
  const response = await axios.post(`${API_URL}/config`, config);
  return response.data;
};

// GitHub Sync
export const syncGithubProjects = async () => {
  const response = await axios.post(`${API_URL}/github/sync`);
  return response.data;
};
