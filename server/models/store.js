// Simple in-memory store for MVP
// In production, this would be a database (MongoDB/Postgres)

let projects = [];
const executions = [];

const getProjects = () => projects;

const setProjects = (newProjects) => {
  projects = newProjects;
};

const getExecutions = () => executions;

let config = {
  githubUsername: process.env.GITHUB_USERNAME || '',
  githubToken: process.env.GITHUB_TOKEN || ''
};

const getConfig = () => config;
const setConfig = (newConfig) => {
  config = { ...config, ...newConfig };
};

const addExecution = (exec) => {
  executions.unshift(exec); // Add to top
  if (executions.length > 100) executions.pop(); // Keep last 100
};

const getExecution = (id) => executions.find(e => e.id === id);

const clearProjectHistory = (projectId) => {
  // Modify in place to remove executions for this project
  let i = executions.length;
  while (i--) {
    if (executions[i].projectId === projectId) {
      executions.splice(i, 1);
    }
  }
};

module.exports = {
  getProjects,
  setProjects,
  getExecutions,
  getConfig,
  setConfig,
  addExecution,
  getExecution,
  clearProjectHistory
};
