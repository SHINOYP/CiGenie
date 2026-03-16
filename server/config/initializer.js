const connectDB = require('./db');
const githubService = require('../services/githubService');
const deploymentController = require('../controllers/deploymentController');

/**
 * Initializes services and syncs data on startup
 */
const initialize = async () => {
    try {
        console.log('\x1b[36m%s\x1b[0m', '[System] Connecting to MongoDB...');
        await connectDB();

        console.log('\x1b[36m%s\x1b[0m', '[System] Initializing configuration...');
        
        // Initial project fetch
        const projects = await githubService.fetchProjects();
        if (projects) {
            console.log('\x1b[32m%s\x1b[0m', `[System] GitHub project synchronization complete (${projects.length} repos)`);
        } else {
            console.warn('\x1b[33m%s\x1b[0m', '[System] GitHub synchronization failed. Check your token in .env');
        }

        // Auto-sync Jenkins builds using the unified controller logic
        console.log('\x1b[36m%s\x1b[0m', '[System] Syncing Jenkins execution history...');
        const syncedCount = await deploymentController.syncJenkinsHistory();

        console.log('\x1b[32m%s\x1b[0m', `[System] Successfully synced ${syncedCount} legacy builds`);

    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', `[Critical] Initialization failed: ${error.message}`);
    }
};

module.exports = initialize;
