const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

router.get('/stats', systemController.getDashboardStats);
router.get('/status', systemController.getSystemStatus);
router.get('/paths', systemController.getFileSystemPaths);
router.get('/insights', systemController.getSystemRecommendations);

module.exports = router;
