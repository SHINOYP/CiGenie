const express = require('express');
const router = express.Router();
const deploymentController = require('../controllers/deploymentController');

router.get('/projects', deploymentController.getProjects);
router.post('/intent', deploymentController.analyzeIntent);
router.post('/execute', deploymentController.executePlan);
router.get('/execution/:id', deploymentController.getExecution);
router.get('/history', deploymentController.getHistory);

module.exports = router;
