const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

router.post('/github', (req, res) => webhookController.handleGithubWebhook(req, res));
router.post('/jenkins', (req, res) => webhookController.handleJenkinsWebhook(req, res));

module.exports = router;
