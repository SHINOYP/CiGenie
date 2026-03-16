const store = require('../models/store');
const githubService = require('../services/githubService');

// GET /api/config
const getConfig = async (req, res) => {
    const config = await store.getConfig();
    res.json(config);
};

// POST /api/config
const updateConfig = async (req, res) => {
    try {
        const { 
            githubUsername, 
            githubToken, 
            jenkinsUrl, 
            jenkinsUser, 
            jenkinsToken, 
            geminiApiKey 
        } = req.body;
        
        await store.setConfig({ 
            githubUsername, 
            githubToken, 
            jenkinsUrl, 
            jenkinsUser, 
            jenkinsToken, 
            geminiApiKey 
        });

        // Trigger a re-fetch of projects with new credentials
        await githubService.fetchProjects();

        res.json({ success: true, message: 'Configuration updated and projects synced' });
    } catch (error) {
        console.error('Config update failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getConfig,
    updateConfig
};
