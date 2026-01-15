const axios = require('axios');
const store = require('../models/store');

const BASE_URL = 'https://api.github.com';

const fetchProjects = async () => {
    const username = process.env.GITHUB_USERNAME;
    if (!username) {
        console.warn('[GithubService] GITHUB_USERNAME is not set in .env');
        return [];
    }

    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };

        // Add token if available to increase rate limits
        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }

        console.log(`[GithubService] Fetching repos for user: ${username}`);
        const response = await axios.get(`${BASE_URL}/users/${username}/repos?sort=updated&per_page=10`, { headers });
        
        const repos = response.data;
        
        // Map GitHub repos to our project structure
        const projects = repos.map(repo => ({
            id: `gh_${repo.id}`,
            name: repo.name,
            repo: repo.name, // For display
            cloneUrl: repo.clone_url,
            description: repo.description,
            defaultBranch: repo.default_branch,
            jenkinsJob: `pipeline-${repo.name}`, // Assumption: Jenkins job matches repo name
            environments: ['dev', 'staging', 'production'], // Default envs
            updatedAt: repo.updated_at
        }));

        console.log(`[GithubService] Fetched ${projects.length} projects.`);
        store.setProjects(projects);
        return projects;

    } catch (error) {
        console.error('[GithubService] Error fetching repos:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
        return [];
    }
};

module.exports = {
    fetchProjects
};
