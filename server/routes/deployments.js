const express = require('express');
const router = express.Router();
const deploymentController = require('../controllers/deploymentController');

router.get('/projects', deploymentController.getProjects);
router.post('/intent', deploymentController.analyzeIntent);
router.post('/execute', deploymentController.executePlan);
router.get('/execution/:id', deploymentController.getExecution);
router.get('/history', deploymentController.getHistory);

// Dashboard Routes
router.get('/stats', deploymentController.getDashboardStats);
router.get('/status', deploymentController.getSystemStatus);
router.get('/insights', deploymentController.getAIInsights);

// Sync Route
router.post('/sync-jenkins', deploymentController.syncJenkinsHistory);

module.exports = router;
