const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');

router.post('/sync', githubController.syncProjects);

module.exports = router;
