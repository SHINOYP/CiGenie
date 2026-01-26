const decisionService = require('../services/decisionService');
const jenkinsService = require('../services/jenkinsService');
const store = require('../models/store');
const githubService = require('../services/githubService');

// Simple UUID fallback
const generateId = () => Math.random().toString(36).substring(2, 15);

// Helper to simulate build progress (since we don't have real Jenkins callbacks yet)
const simulateExecution = (executionId) => {
  const steps = [
      { progress: 10, msg: '[INFO] Initializing decision engine...' },
      { progress: 30, msg: '[INFO] Jenkins job triggered successfully.' },
      { progress: 50, msg: '[INFO] Running tests... (Mocking wait)' },
      { progress: 80, msg: '[INFO] Tests passed. Deploying artifacts...' },
      { progress: 100, msg: '[SUCCESS] Deployment complete.' }
  ];

  let currentStep = 0;
  const interval = setInterval(() => {
      const exec = store.getExecution(executionId);
      if (!exec) { clearInterval(interval); return; }

      if (currentStep >= steps.length) {
          exec.status = 'SUCCESS';
          clearInterval(interval);
          return;
      }

      const step = steps[currentStep];
      exec.logs.push(`[${new Date().toISOString()}] ${step.msg}`);
      
      // Randomly fail sometimes for demo
      if (currentStep === 2 && Math.random() > 0.8) {
          exec.status = 'FAILED';
          exec.logs.push(`[${new Date().toISOString()}] [ERROR] Integration tests failed!`);
          exec.logs.push(`[${new Date().toISOString()}] [AI] Analyzing failure patterns...`);
          clearInterval(interval);
          return;
      }

      currentStep++;
  }, 2000);
};

// GET /api/projects
const getProjects = async (req, res) => {
  // If store is empty, try to fetch
  if (store.getProjects().length === 0) {
      await githubService.fetchProjects();
  }
  res.json(store.getProjects());
};

// POST /api/deploy/intent
const analyzeIntent = async (req, res) => {
  try {
    const { projectId, action, environment, branch } = req.body;
    const plan = await decisionService.analyzeIntent(projectId, { action, environment, branch });
    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/deploy/execute
const executePlan = async (req, res) => {
  try {
    const { plan } = req.body;
    
    // 1. Create execution record
    const executionId = generateId();
    const executionRecord = {
      id: executionId,
      projectId: plan.projectId,
      status: 'PENDING',
      stage: 'INIT',
      logs: [],
      plan: plan,
      startTime: new Date()
    };
    
    store.addExecution(executionRecord);

    const useRealJenkins = process.env.USE_REAL_JENKINS === 'true';

    if (useRealJenkins) {
        console.log(`[DeploymentController] Triggering REAL Jenkins job: ${plan.jenkinsJob}`);
        try {
            // --- Auto-Provisioning Logic Start ---
            const jobExists = await jenkinsService.checkJobExists(plan.jenkinsJob);
            
            if (!jobExists) {
                console.log(`[DeploymentController] Job ${plan.jenkinsJob} not found. Attempting to auto-create...`);
                
                // We need the cloneUrl. Fetch project from store.
                const project = store.getProjects().find(p => p.id === plan.projectId);
                
                if (project && project.cloneUrl) {
                     await jenkinsService.createJob(plan.jenkinsJob, project.cloneUrl);
                     console.log(`[DeploymentController] Job ${plan.jenkinsJob} created successfully.`);
                } else {
                    throw new Error(`Cannot create job: Project or Clone URL not found for ${plan.projectId}`);
                }
            }
            // --- Auto-Provisioning Logic End ---

            await jenkinsService.triggerBuild(plan.jenkinsJob, plan.jenkinsParams);
            executionRecord.status = 'QUEUED';
            executionRecord.logs.push(`[${new Date().toISOString()}] [INFO] Jenkins Build Triggered Successfully`);
        } catch (jErr) {
            console.error('Jenkins Trigger Failed:', jErr);
            executionRecord.status = 'FAILED';
            executionRecord.logs.push(`[${new Date().toISOString()}] [ERROR] Failed to trigger Jenkins: ${jErr.message}`);
        }
    } else {
        // 2. Simulate Progress
        console.log(`[DeploymentController] Simulating execution for: ${executionId}`);
        simulateExecution(executionId);
    }

    res.json({ executionId, status: executionRecord.status });

  } catch (error) {
     console.error(error);
     res.status(500).json({ error: error.message });
  }
};

// GET /api/deploy/execution/:id
const getExecution = (req, res) => {
  const { id } = req.params;
  const execution = store.getExecution(id);
  if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
  }
  res.json(execution);
};

// GET /api/deploy/history
const getHistory = (req, res) => {
  res.json(store.getExecutions());
};

module.exports = {
  getProjects,
  analyzeIntent,
  executePlan,
  getExecution,
  getHistory
};
