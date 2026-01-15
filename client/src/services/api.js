import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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

export const getExecutionDetails = async (id) => {
    const response = await axios.get(`${API_URL}/deploy/execution/${id}`);
    return response.data;
};
