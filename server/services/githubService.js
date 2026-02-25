const axios = require('axios');
const store = require('../models/store');


const BASE_URL = 'https://api.github.com';

/**
 * Fetches package.json content for a repo to detect project type
 */
const fetchPackageJson = async (owner, repo, token) => {
    try {
        const headers = { 'Accept': 'application/vnd.github.v3.raw' };
        if (token) headers['Authorization'] = `token ${token}`;

        const url = `${BASE_URL}/repos/${owner}/${repo}/contents/package.json`;
        console.log(`[GithubService] Checking package.json for ${repo}...`);

        const response = await axios.get(url, { headers });
        return response.data;
    } catch (error) {
        // It's okay if package.json doesn't exist (might not be a JS project)
        return null;
    }
};

/**
 * Detects project type based on dependencies
 */
const detectProjectType = (packageJson) => {
    if (!packageJson || !packageJson.dependencies) return 'UNKNOWN';

    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps['react'] || deps['next'] || deps['vite']) return 'REACT';
    if (deps['express'] || deps['fastify'] || deps['nestjs']) return 'NODE';

    return 'NODE'; // Default fallback for other JS projects
};

const fetchProjects = async () => {
    const config = await store.getConfig();
    const username = config.githubUsername;
    const token = config.githubToken;

    if (!username) {
        console.warn('[GithubService] GITHUB_USERNAME is not set. Go to Settings to configure.');
        return [];
    }

    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };

        // Add token if available to increase rate limits
        if (token) {
            headers['Authorization'] = `token ${token}`;
        }

        console.log(`[GithubService] Fetching repos for user: ${username}`);
        const response = await axios.get(`${BASE_URL}/users/${username}/repos?sort=updated&per_page=100`, { headers });

        const repos = response.data;

        // Map GitHub repos to our project structure
        // We use Promise.all to fetch package.json for all repos in parallel
        const projectPromises = repos.map(async (repo) => {
            const packageJson = await fetchPackageJson(repo.owner.login, repo.name, token);
            const projectType = detectProjectType(packageJson);

            return {
                id: `gh_${repo.id}`,
                name: repo.name,
                repo: repo.name, // For display
                cloneUrl: repo.clone_url,
                description: repo.description,
                defaultBranch: repo.default_branch,
                jenkinsJob: `pipeline-${repo.name}`,
                type: projectType, // NEW: Store detected type
                environments: ['dev', 'staging', 'production'],
                updatedAt: repo.updated_at
            };
        });

        const projects = await Promise.all(projectPromises);

        console.log(`[GithubService] Fetched ${projects.length} projects.`);
        await store.setProjects(projects);
        return projects;

    } catch (error) {
        console.error('[GithubService] Error fetching repos:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
        return [];
    }
};

/**
 * Checks if package.json has a "test" script
 */
const hasTestScript = async (owner, repo, token) => {
    const packageJson = await fetchPackageJson(owner, repo, token);
    if (!packageJson || !packageJson.scripts) return false;
    return !!packageJson.scripts.test;
};

module.exports = {
    fetchProjects,
    hasTestScript
};
