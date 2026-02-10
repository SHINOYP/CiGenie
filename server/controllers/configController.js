const store = require('../models/store');
const githubService = require('../services/githubService');

// GET /api/config
const getConfig = (req, res) => {
    res.json(store.getConfig());
};

// POST /api/config
const updateConfig = async (req, res) => {
    try {
        const { githubUsername, githubToken } = req.body;
        store.setConfig({ githubUsername, githubToken });

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
