const axios = require('axios');

const BASE_URL = process.env.JENKINS_URL || 'http://localhost:8080';
const USER = 'shino';
const TOKEN = '11777f7394135a5b7952f12c59b39f1053';

const getAuthHeader = () => {
  return {
    Authorization: `Basic ${Buffer.from(`${USER}:${TOKEN}`).toString('base64')}`,
  };
};

/**
 * Fetches Jenkins crumb for CSRF protection
 */
const getCrumb = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/crumbIssuer/api/json`, {
      headers: getAuthHeader(),
    });
    return {
      [response.data.crumbRequestField]: response.data.crumb
    };
  } catch (error) {
    console.warn('CSRF protection may not be enabled');
    return {};
  }
};

/**
 * Triggers a build for a specific job.
 * @param {string} jobName - Use format "folder/job" for jobs in folders
 * @param {object} params - Build parameters
 */
const triggerBuild = async (jobName, params = {}) => {
  // Encode job name properly (handles spaces and special chars)
  const encodedJobName = jobName.split('/').map(encodeURIComponent).join('/job/');
  
  // Choose endpoint based on whether params exist
  const endpoint = Object.keys(params).length > 0 
    ? 'buildWithParameters' 
    : 'build';

  // Get CSRF crumb
  const crumb = await getCrumb();

  try {
    const url = `${BASE_URL}/job/${encodedJobName}/${endpoint}`;
    
    console.log(`Triggering Jenkins build: ${url}`);
    
    const response = await axios.post(url, null, {
      headers: {
        ...getAuthHeader(),
        ...crumb
      },
      params: params, // axios will handle URL encoding
    });
    
    return { success: true, status: response.status };
  } catch (error) {
    // Retry logic: If job is not parameterized (e.g. first run), fallback to simple build
    if (error.response && error.response.status === 400 && endpoint === 'buildWithParameters') {
       console.log('Job not parameterized. Retrying with simple /build...');
       const simpleUrl = `${BASE_URL}/job/${encodedJobName}/build`;
       try {
           const retryResponse = await axios.post(simpleUrl, null, {
               headers: { ...getAuthHeader(), ...crumb }
           });
           return { success: true, status: retryResponse.status };
       } catch (retryError) {
           console.error('Retry failed:', retryError.message);
           throw retryError;
       }
    }
    
    console.error('Failed to trigger Jenkins build:', error.response?.data || error.message);
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
    const encodedJobName = jobName.split('/').map(encodeURIComponent).join('/job/');
    const url = `${BASE_URL}/job/${encodedJobName}/${buildId}/consoleText`;
    
    const response = await axios.get(url, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch build logs:', error.response?.data || error.message);
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
    const encodedJobName = jobName.split('/').map(encodeURIComponent).join('/job/');
    const url = `${BASE_URL}/job/${encodedJobName}/${buildId}/api/json`;
    
    const response = await axios.get(url, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch build details:', error.response?.data || error.message);
    throw new Error(`Fetch Build Details Failed: ${error.message}`);
  }
};

/**
 * Checks if a job exists in Jenkins.
 * @param {string} jobName 
 * @returns {Promise<boolean>}
 */
const checkJobExists = async (jobName) => {
  try {
    const encodedJobName = jobName.split('/').map(encodeURIComponent).join('/job/');
    const url = `${BASE_URL}/job/${encodedJobName}/api/json`;
    
    await axios.get(url, { headers: getAuthHeader() });
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false;
    }
    throw error;
  }
};

/**
 * Creates a new Pipeline job in Jenkins pointing to a Git repo.
 * @param {string} jobName 
 * @param {string} gitUrl 
 */
const { getReactPipeline, getNodePipeline } = require('../templates/pipelineTemplates');

// ... (other imports and code)

/**
 * Generates the Jenkins Job Config XML with the inline pipeline.
 */
const generateConfigXml = (gitUrl, projectType) => {
    const pipelineScript = projectType === 'REACT' 
        ? getReactPipeline(gitUrl) 
        : getNodePipeline(gitUrl);

    const escapedScript = pipelineScript
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return `<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <description>Auto-generated by CiGenie for ${gitUrl} [Type: ${projectType}]</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps">
    <script>${escapedScript}</script>
    <sandbox>true</sandbox>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>`;
};

/**
 * Creates a new Pipeline job in Jenkins with a generated script based on project type.
 * @param {string} jobName 
 * @param {string} gitUrl
 * @param {string} projectType - 'REACT' or 'NODE'
 */
const createJob = async (jobName, gitUrl, projectType = 'NODE') => {
  try {
    const crumb = await getCrumb();
    const headers = {
      ...getAuthHeader(),
      ...crumb,
      'Content-Type': 'application/xml'
    };

    const configXml = generateConfigXml(gitUrl, projectType);
    const actualJobName = jobName.includes('/') ? jobName.split('/').pop() : jobName;
    const url = `${BASE_URL}/createItem?name=${encodeURIComponent(actualJobName)}`;
    
    console.log(`[JenkinsService] Creating new job: ${actualJobName} -> ${gitUrl} (${projectType})`);
    await axios.post(url, configXml, { headers });
    return true;

  } catch (error) {
    console.error('Failed to create Jenkins job:', error.response?.data || error.message);
    throw new Error(`Job Creation Failed: ${error.message}`);
  }
};

/**
 * Updates an existing Jenkins job configuration.
 * @param {string} jobName 
 * @param {string} gitUrl 
 * @param {string} projectType 
 */
const updateJob = async (jobName, gitUrl, projectType = 'NODE') => {
    try {
        const crumb = await getCrumb();
        const headers = {
            ...getAuthHeader(),
            ...crumb,
            'Content-Type': 'application/xml'
        };

        const configXml = generateConfigXml(gitUrl, projectType);
        const actualJobName = jobName.includes('/') ? jobName.split('/').pop() : jobName;
        // The endpoint to update config is /job/:name/config.xml
        const encodedJobName = actualJobName; // Assuming flat structure for now
        const url = `${BASE_URL}/job/${encodeURIComponent(encodedJobName)}/config.xml`;

        console.log(`[JenkinsService] Updating job config: ${actualJobName} -> ${projectType}`);
        await axios.post(url, configXml, { headers });
        return true;

    } catch (error) {
        console.error('Failed to update Jenkins job:', error.response?.data || error.message);
        throw new Error(`Job Update Failed: ${error.message}`);
    }
};

/**
 * Gets details of a specific job (including last build info).
 * @param {string} jobName 
 */
const getJobDetails = async (jobName) => {
  try {
    const encodedJobName = jobName.split('/').map(encodeURIComponent).join('/job/');
    const url = `${BASE_URL}/job/${encodedJobName}/api/json`;
    
    const response = await axios.get(url, { headers: getAuthHeader() });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch job details:', error.response?.data || error.message);
    throw new Error(`Fetch Job Details Failed: ${error.message}`);
  }
};

module.exports = {
  triggerBuild,
  getBuildLogs,
  getBuildDetails,
  checkJobExists,
  createJob,
  updateJob,
  getJobDetails
};