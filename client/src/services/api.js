import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://547e-2402-3a80-1e0b-483b-8101-e54c-2e5d-1c60.ngrok-free.app/api";

const apiClient = axios.create({
  baseURL: API_URL.trim(),
  headers: {
    // Required for ngrok free tunnel links to bypass browser interstitial.
    "ngrok-skip-browser-warning": "true",
  },
});

export const getProjects = async () => {
  const response = await apiClient.get("/deploy/projects");
  return response.data;
};

export const analyzeIntent = async (projectId, intent) => {
  const response = await apiClient.post("/deploy/intent", {
    projectId,
    ...intent,
  });
  return response.data;
};

export const executePlan = async (plan) => {
  const response = await apiClient.post("/deploy/execute", { plan });
  return response.data;
};

export const getHistory = async () => {
  const response = await apiClient.get("/deploy/history");
  return response.data;
};

export const getExecution = async (id) => {
  const response = await apiClient.get(`/deploy/execution/${id}`);
  return response.data;
};

export const deleteProjectJob = async (projectId) => {
  const response = await apiClient.delete(`/deploy/${projectId}`);
  return response.data;
};
// Dashboard API calls
export const getDashboardStats = async () => {
  const response = await apiClient.get("/system/stats");
  return response.data;
};

export const getSystemStatus = async () => {
  const response = await apiClient.get("/system/status");
  return response.data;
};

export const getSystemRecommendations = async () => {
  const response = await apiClient.get("/system/insights");
  return response.data;
};

export const getLivePaths = () =>
  apiClient.get("/system/paths").then((res) => res.data);

export const syncJenkinsStatus = async () => {
  const response = await apiClient.post("/deploy/sync-jenkins");
  return response.data;
};

// Config
export const getConfig = async () => {
  const response = await apiClient.get("/config");
  return response.data;
};

export const updateConfig = async (config) => {
  const response = await apiClient.post("/config", config);
  return response.data;
};

// GitHub Sync
export const syncGithubProjects = async () => {
  const response = await apiClient.post("/github/sync");
  return response.data;
};

// Authentication
export const registerUser = async (email, password) => {
  const response = await apiClient.post("/auth/register", {
    email,
    password,
  });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await apiClient.post("/auth/login", {
    email,
    password,
  });
  return response.data;
};
