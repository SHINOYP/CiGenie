const axios = require('axios');

const BASE_URL = process.env.JENKINS_URL || 'http://localhost:8080';
const USER = process.env.JENKINS_USER || 'admin';
const TOKEN = process.env.JENKINS_TOKEN || '11441f6a3209e242fff5e32faa529370ea';

const getAuthHeader = () => {
  return {
    Authorization: `Basic ${Buffer.from(`${USER}:${TOKEN}`).toString('base64')}`,
  };
};

/**
 * Triggers a build for a specific job.
 * @param {string} jobName
 * @param {object} params - Build parameters
 */
const triggerBuild = async (jobName, params = {}) => {
  try {
    const url = `${BASE_URL}/job/${jobName}/buildWithParameters`;
    // Jenkins expects form-data or query params for buildWithParameters
    const queryParams = new URLSearchParams(params).toString();
    
    console.log(`Triggering Jenkins build: ${url}?${queryParams}`);
    
    const response = await axios.post(`${url}?${queryParams}`, {}, {
      headers: getAuthHeader(),
    });
    
    return { success: true, status: response.status };
  } catch (error) {
    console.error('Failed to trigger Jenkins build:', error.message);
    throw new Error(`Jenkins Build Trigger Failed: ${error.message}`);
  }
};

/**
 * Fetches console output for a specific build.
 * @param {string} jobName
 * @param {number} buildId
 */
const getBuildLogs = async (jobName, buildId) => {
  try {
    const url = `${BASE_URL}/job/${jobName}/${buildId}/consoleText`;
    const response = await axios.get(url, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch build logs:', error.message);
    throw new Error(`Fetch Logs Failed: ${error.message}`);
  }
};

/**
 * Gets details of a specific build.
 * @param {string} jobName 
 * @param {number} buildId 
 */
const getBuildDetails = async (jobName, buildId) => {
    try {
    const url = `${BASE_URL}/job/${jobName}/${buildId}/api/json`;
    const response = await axios.get(url, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch build details:', error.message);
    throw new Error(`Fetch Build Details Failed: ${error.message}`);
  }
};

module.exports = {
  triggerBuild,
  getBuildLogs,
  getBuildDetails
};
