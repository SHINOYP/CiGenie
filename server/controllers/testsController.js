const { triggerTestJob } = require('../services/jenkinsService');

const runTests = async (req, res) => {
  const { repoUrl, projectType } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'repoUrl is required' });
  }

  try {
    const jobName = await triggerTestJob({
      repoUrl,
      projectType
    });

    res.json({
      status: 'STARTED',
      jobName
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'FAILED',
      error: err.message
    });
  }
};

module.exports = {
  runTests
};
