const axios = require('axios');

class JenkinsService {
  constructor() {
    this.baseUrl = process.env.JENKINS_URL || 'http://localhost:8080';
    this.user = process.env.JENKINS_USER || 'admin';
    this.token = process.env.JENKINS_TOKEN; // API Token, not password
  }

  getAuthHeader() {
    return {
      Authorization: `Basic ${Buffer.from(`${this.user}:${this.token}`).toString('base64')}`,
    };
  }

  /**
   * Triggers a build for a specific job.
   * @param {string} jobName
   * @param {object} params - Build parameters
   */
  async triggerBuild(jobName, params = {}) {
    try {
      const url = `${this.baseUrl}/job/${jobName}/buildWithParameters`;
      // Jenkins expects form-data or query params for buildWithParameters
      const queryParams = new URLSearchParams(params).toString();
      
      console.log(`Triggering Jenkins build: ${url}?${queryParams}`);
      
      const response = await axios.post(`${url}?${queryParams}`, {}, {
        headers: this.getAuthHeader(),
      });
      
      return { success: true, status: response.status };
    } catch (error) {
      console.error('Failed to trigger Jenkins build:', error.message);
      throw new Error(`Jenkins Build Trigger Failed: ${error.message}`);
    }
  }

  /**
   * Fetches console output for a specific build.
   * @param {string} jobName
   * @param {number} buildId
   */
  async getBuildLogs(jobName, buildId) {
    try {
      const url = `${this.baseUrl}/job/${jobName}/${buildId}/consoleText`;
      const response = await axios.get(url, {
        headers: this.getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch build logs:', error.message);
      throw new Error(`Fetch Logs Failed: ${error.message}`);
    }
  }

  /**
   * Gets details of a specific build.
   * @param {string} jobName 
   * @param {number} buildId 
   */
  async getBuildDetails(jobName, buildId) {
     try {
      const url = `${this.baseUrl}/job/${jobName}/${buildId}/api/json`;
      const response = await axios.get(url, {
        headers: this.getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch build details:', error.message);
      throw new Error(`Fetch Build Details Failed: ${error.message}`);
    }
  }
}

module.exports = new JenkinsService();
