const jenkinsService = require('../services/jenkinsService');

class WebhookController {
  
  /**
   * Handles GitHub Webhooks (Push events).
   * Triggers a Jenkins build.
   */
  async handleGithubWebhook(req, res) {
    try {
      const event = req.headers['x-github-event'];
      const payload = req.body;

      console.log(`Received GitHub Event: ${event}`);

      if (event === 'push') {
        const repoName = payload.repository.name;
        const branch = payload.ref.replace('refs/heads/', '');
        const commitId = payload.head_commit.id;

        console.log(`Push detected on ${repoName}/${branch} (Commit: ${commitId})`);

        // Trigger Jenkins Job (assuming job name matches repo name for now)
        // In a real app, we'd map repo -> job ID
        const jobName = `${repoName}-build`; 
        
        await jenkinsService.triggerBuild(jobName, {
          BRANCH: branch,
          COMMIT_ID: commitId,
        });

        return res.status(200).json({ message: 'Build triggered successfully' });
      }

      res.status(200).json({ message: 'Event ignored' });
    } catch (error) {
      console.error('GitHub Webhook Error:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }

  /**
   * Handles Jenkins Webhooks (Build Status changes).
   * Updates internal state/DB.
   */
  async handleJenkinsWebhook(req, res) {
    try {
      const { jobName, buildId, status, buildUrl } = req.body;
      
      console.log(`Jenkins Update: Job=${jobName}, Build=${buildId}, Status=${status}`);

      // TODO: Save build status to Database

      if (status === 'FAILURE') {
         console.log('Build Failed! Initiating AI Analysis (Future Scope)');
         // TODO: Trigger AI analysis here in Phase 2
      }

      res.status(200).json({ message: 'Status received' });
    } catch (error) {
      console.error('Jenkins Webhook Error:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }
}

module.exports = new WebhookController();
