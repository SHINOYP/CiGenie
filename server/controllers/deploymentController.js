const decisionService = require('../services/decisionService');
const jenkinsService = require('../services/jenkinsService');
const store = require('../models/store');
const githubService = require('../services/githubService');
const simulationService = require('../services/simulationService');

// Simple UUID fallback
const generateId = () => Math.random().toString(36).substring(2, 15);

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
                     await jenkinsService.createJob(plan.jenkinsJob, project.cloneUrl, project.type);
                     console.log(`[DeploymentController] Job ${plan.jenkinsJob} created successfully.`);
                } else {
                    throw new Error(`Cannot create job: Project or Clone URL not found for ${plan.projectId}`);
                }
            } else {
                // NEW: Ensure the job config is up to date (Migration from SCM to Inline)
                const project = store.getProjects().find(p => p.id === plan.projectId);
                if (project && project.cloneUrl) {
                     console.log(`[DeploymentController] Job ${plan.jenkinsJob} exists. Updating config...`);
                     await jenkinsService.updateJob(plan.jenkinsJob, project.cloneUrl, project.type);
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
        simulationService.simulateExecution(executionId);
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
