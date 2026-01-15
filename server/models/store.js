// Simple in-memory store for MVP
// In production, this would be a database (MongoDB/Postgres)

let projects = [];
const executions = [];

const getProjects = () => projects;

const setProjects = (newProjects) => {
  projects = newProjects;
};

const getExecutions = () => executions;

const addExecution = (exec) => {
  executions.unshift(exec); // Add to top
  if (executions.length > 100) executions.pop(); // Keep last 100
};

const getExecution = (id) => executions.find(e => e.id === id);

module.exports = {
  getProjects,
  setProjects,
  getExecutions,
  addExecution,
  getExecution
};
