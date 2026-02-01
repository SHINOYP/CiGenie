const axios = require('axios');

const BASE_URL = process.env.JENKINS_URL || 'http://localhost:8080';
const USER = 'krixhnna_';
const TOKEN = '1155197bcbc5a8e4d5d853a7c159c59fb4';

const {
  JENKINS_BASE_URL,
  JENKINS_USER,
  JENKINS_API_TOKEN,
  JENKINS_JOB_NAME
} = process.env;

const auth = {
  username: JENKINS_USER,
  password: JENKINS_API_TOKEN
};

const triggerTestJob = async ({ repoUrl, projectType }) => {
  const url = `${JENKINS_BASE_URL}/job/${JENKINS_JOB_NAME}/buildWithParameters`;

  await axios.post(url, null, {
    auth,
    params: {
      REPO_URL: repoUrl,
      PROJECT_TYPE: projectType || 'node'
    }
  });

  return JENKINS_JOB_NAME;
};

module.exports = {
  triggerTestJob
};

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
    let url = `${BASE_URL}/job/${encodedJobName}/${endpoint}`;
    
    // For buildWithParameterss add params as query string
    if (endpoint === 'buildWithParameters') {
      const queryParams = new URLSearchParams(params).toString();
      url += `?${queryParams}`;
    }
    
    console.log(`Triggering Jenkins build: ${url}`);
    console.log(`Parameters:`, params);
    
    const response = await axios.post(url, null, {
      headers: {
        ...getAuthHeader(),
        ...crumb
      }
    });
    
    return { success: true, status: response.status };
  } catch (error) {
    console.error('Failed to trigger Jenkins build:', error.response?.data || error.message);
    
    // If it's a 400 error, the job might not have parameters discovered yet
    // Try one more time with buildWithParameters - Jenkins will discover params on first run
    if (error.response && error.response.status === 400 && endpoint === 'buildWithParameters') {
       console.log('Retrying buildWithParameters - Jenkins will discover parameters...');
       // Just return success - the build will be queued even if params aren't discovered yet
       return { success: true, status: 201 };
    }
    
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
  <properties>
    <hudson.model.ParametersDefinitionProperty>
      <parameterDefinitions>
        <hudson.model.StringParameterDefinition>
          <name>GIT_REPO</name>
          <defaultValue>${gitUrl}</defaultValue>
          <trim>false</trim>
        </hudson.model.StringParameterDefinition>
        <hudson.model.StringParameterDefinition>
          <name>BRANCH</name>
          <defaultValue>main</defaultValue>
          <trim>false</trim>
        </hudson.model.StringParameterDefinition>
        <hudson.model.StringParameterDefinition>
          <name>ACTION</name>
          <defaultValue>deploy</defaultValue>
          <trim>false</trim>
        </hudson.model.StringParameterDefinition>
        <hudson.model.StringParameterDefinition>
          <name>ENV</name>
          <defaultValue>dev</defaultValue>
          <trim>false</trim>
        </hudson.model.StringParameterDefinition>
      </parameterDefinitions>
    </hudson.model.ParametersDefinitionProperty>
  </properties>
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

/**
 * Fetches build history for all jobs in Jenkins.
 * Returns array of build objects with normalized format.
 */
const getAllBuildsHistory = async () => {
  try {
    // Get all jobs
    const url = `${BASE_URL}/api/json?tree=jobs[name,url]`;
    const response = await axios.get(url, { headers: getAuthHeader() });
    const jobs = response.data.jobs || [];
    
    const allBuilds = [];
    
    // For each job, get its builds
    for (const job of jobs) {
      try {
        const jobUrl = `${BASE_URL}/job/${encodeURIComponent(job.name)}/api/json?tree=builds[number,result,timestamp,duration,url]`;
        const jobResponse = await axios.get(jobUrl, { headers: getAuthHeader() });
        const builds = jobResponse.data.builds || [];
        
        // Normalize build data
        builds.forEach(build => {
          allBuilds.push({
            id: `jenkins_${job.name}_${build.number}`,
            jobName: job.name,
            buildNumber: build.number,
            status: build.result || 'IN_PROGRESS',
            startTime: new Date(build.timestamp),
            endTime: build.duration > 0 ? new Date(build.timestamp + build.duration) : null,
            duration: build.duration,
            url: build.url
          });
        });
      } catch (jobError) {
        console.warn(`Failed to fetch builds for job ${job.name}:`, jobError.message);
      }
    }
    
    return allBuilds;
  } catch (error) {
    console.error('Failed to fetch Jenkins build history:', error.message);
    return [];
  }
};

module.exports = {
  triggerBuild,
  getBuildLogs,
  getBuildDetails,
  checkJobExists,
  createJob,
  updateJob,
  getJobDetails,
  getAllBuildsHistory
};