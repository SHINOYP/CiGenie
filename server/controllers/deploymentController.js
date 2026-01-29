const decisionService = require('../services/decisionService');
const jenkinsService = require('../services/jenkinsService');
const store = require('../models/store');
const githubService = require('../services/githubService');
const simulationService = require('../services/simulationService');

// Simple UUID fallback
const generateId = () => Math.random().toString(36).substring(2, 15);

// GET /api/projects
const getProjects = async (req, res) => {
  // Return cached projects from store
  // Only fetch from GitHub if store is empty (done on server startup)
  const projects = store.getProjects();
  res.json(projects);
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
            executionRecord.endTime = new Date();
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

// GET /api/deploy/stats
const getDashboardStats = (req, res) => {
    const executions = store.getExecutions();
    const totalBuilds = executions.length;
    
    const successCount = executions.filter(e => e.status === 'SUCCESS').length;
    const failedCount = executions.filter(e => e.status === 'FAILED').length;
    const successRate = totalBuilds > 0 ? ((successCount / totalBuilds) * 100).toFixed(1) + '%' : '0%';
    
    // Calculate Avg Duration
    let totalDurationMs = 0;
    let durationCount = 0;
    executions.forEach(e => {
        if (e.endTime && e.startTime) {
            totalDurationMs += (new Date(e.endTime) - new Date(e.startTime));
            durationCount++;
        }
    });
    
    let avgDuration = '0s';
    if (durationCount > 0) {
        const avgMs = totalDurationMs / durationCount;
        const avgSec = Math.floor(avgMs / 1000);
        if (avgSec < 60) avgDuration = `${avgSec}s`;
        else {
            const min = Math.floor(avgSec / 60);
            const sec = avgSec % 60;
            avgDuration = `${min}m ${sec}s`;
        }
    }

    res.json({
        totalBuilds,
        successRate,
        failedBuilds: failedCount,
        avgDuration
    });
};

// GET /api/deploy/status
const getSystemStatus = (req, res) => {
    const useRealJenkins = process.env.USE_REAL_JENKINS === 'true';
    res.json({
        jenkins: useRealJenkins ? 'Connected' : 'Simulated',
        decisionEngine: 'Online',
        aiAnalysis: 'Ready',
        jenkinsStatus: 'Operational' // Mocking "Operational"
    });
};

// GET /api/deploy/insights
const getAIInsights = (req, res) => {
    const executions = store.getExecutions();
    const recentFailures = executions.slice(0, 5).filter(e => e.status === 'FAILED');
    
    if (recentFailures.length >= 2) {
        res.json({
            type: 'warning',
            title: 'High Failure Rate Detected',
            message: `Last ${recentFailures.length} builds failed. AI suggests checking recent dependency updates.`
        });
    } else {
         res.json({
            type: 'info',
            title: 'System Healthy',
            message: 'All systems running within normal parameters. No optimization needed.'
        });
    }
};

// POST /api/deploy/sync-jenkins
const syncJenkinsHistory = async (req, res) => {
    const useRealJenkins = process.env.USE_REAL_JENKINS === 'true';
    
    if (!useRealJenkins) {
        return res.json({ 
            success: false, 
            message: 'Jenkins sync only available when USE_REAL_JENKINS=true',
            synced: 0 
        });
    }
    
    try {
        const jenkinsBuilds = await jenkinsService.getAllBuildsHistory();
        
        // Convert Jenkins builds to our execution format
        jenkinsBuilds.forEach(jb => {
            // Check if already exists
            const existing = store.getExecution(jb.id);
            if (!existing) {
                store.addExecution({
                    id: jb.id,
                    projectId: jb.jobName,
                    status: jb.status === 'SUCCESS' ? 'SUCCESS' : jb.status === 'FAILURE' ? 'FAILED' : 'PENDING',
                    stage: 'COMPLETED',
                    logs: [`[INFO] Synced from Jenkins build #${jb.buildNumber}`],
                    plan: {
                        action: 'JENKINS_BUILD',
                        targetEnv: 'N/A',
                        projectId: jb.jobName,
                        jenkinsParams: {}
                    },
                    startTime: jb.startTime,
                    endTime: jb.endTime
                });
            }
        });
        
        res.json({ 
            success: true, 
            synced: jenkinsBuilds.length,
            message: `Synced ${jenkinsBuilds.length} builds from Jenkins` 
        });
    } catch (error) {
        console.error('Jenkins sync failed:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

module.exports = {
  getProjects,
  analyzeIntent,
  executePlan,
  getExecution,
  getHistory,
  getDashboardStats,
  getSystemStatus,
  getAIInsights,
  syncJenkinsHistory
};
