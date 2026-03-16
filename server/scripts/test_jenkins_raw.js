const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const JENKINS_URL = process.env.JENKINS_URL;
const JENKINS_USER = process.env.JENKINS_USER;
const JENKINS_TOKEN = process.env.JENKINS_TOKEN;

const getAuthHeader = () => {
    const auth = Buffer.from(`${JENKINS_USER}:${JENKINS_TOKEN}`).toString('base64');
    return { 'Authorization': `Basic ${auth}` };
};

const getCrumb = async () => {
    try {
        const response = await axios.get(`${JENKINS_URL}/crumbIssuer/api/json`, { headers: getAuthHeader() });
        return { [response.data.crumbRequestField]: response.data.crumb };
    } catch (error) {
        console.log("No crumb issuer found or error fetching crumb:", error.message);
        return {};
    }
};

async function checkJob(jobName) {
    try {
        await axios.get(`${JENKINS_URL}/job/${encodeURIComponent(jobName)}/api/json`, { headers: getAuthHeader() });
        return true;
    } catch (e) {
        return false;
    }
}

async function forceDelete(jobName) {
    console.log(`\nTesting deletion for: ${jobName}`);
    const exists = await checkJob(jobName);
    if (!exists) {
        console.log(`Job ${jobName} does not exist in Jenkins.`);
        return;
    }

    console.log(`Job ${jobName} exists. Attempting deletion...`);
    const crumb = await getCrumb();
    const headers = { ...getAuthHeader(), ...crumb };
    const url = `${JENKINS_URL}/job/${encodeURIComponent(jobName)}/doDelete`;

    try {
        await axios.post(url, null, { 
            headers,
            maxRedirects: 0, // doDelete redirects to /, which we can catch
            validateStatus: (s) => s >= 200 && s < 400
        });
        console.log(`Success! HTTP 200/302 for ${jobName}`);
    } catch (error) {
        if (error.response && error.response.status === 302) {
            console.log(`Job ${jobName} deleted (Redirected as expected).`);
        } else {
            console.error(`Failed to delete ${jobName}:`, error.message);
            if (error.response) console.log("Status:", error.response.status, "Data:", error.response.data);
        }
    }

    // Verify
    const stillExists = await checkJob(jobName);
    console.log(`Job still exists after attempt: ${stillExists}`);
}

async function runTest() {
    console.log("Jenkins Config:", { JENKINS_URL, JENKINS_USER, tokenPresent: !!JENKINS_TOKEN });
    
    // We'll try a common pattern or ask the user
    // Based on githubService, jobs are named "pipeline-" + repoName
    // Let's look for jobs first
    try {
        const response = await axios.get(`${JENKINS_URL}/api/json?tree=jobs[name]`, { headers: getAuthHeader() });
        const jobs = response.data.jobs;
        console.log("Found jobs in Jenkins:", jobs.map(j => j.name));
        
        if (jobs.length > 0) {
            // ONLY DELETE ONE FOR TESTING IF IT LOOKS LIKE OURS
            const testJob = jobs.find(j => j.name.startsWith('pipeline-')) || jobs[0];
            await forceDelete(testJob.name);
        }
    } catch (err) {
        console.error("Critical failure fetching jobs:", err.message);
    }
}

runTest();
