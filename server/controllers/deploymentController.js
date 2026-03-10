const decisionService = require("../services/decisionService");
const jenkinsExecutor = require("../services/executors/jenkinsExecutor");
const store = require("../models/store");
const githubService = require("../services/githubService");

// Simple UUID fallback
const generateId = () => Math.random().toString(36).substring(2, 15);

// GET /api/projects
const getProjects = async (req, res) => {
  try {
    const projects = await store.getProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/deploy/intent
const analyzeIntent = async (req, res) => {
  try {
    const { projectId, action, environment, branch, outputPath } = req.body;
    const plan = await decisionService.analyzeIntent(projectId, {
      action,
      environment,
      branch,
      outputPath,
    });
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

    // 1. Preflight Validation for TEST actions
    if (plan.action === "test" || plan.action === "TEST") {
      const projects = await store.getProjects();
      const project = projects.find((p) => p.id === plan.projectId);
      const config = await store.getConfig();

      if (project) {
        const owner = config.githubUsername;
        const repo = project.name;

        console.log(
          `[DeploymentController] Preflight check for test script: ${owner}/${repo}`,
        );
        const hasTest = await githubService.hasTestScript(
          owner,
          repo,
          config.githubToken,
        );

        if (!hasTest) {
          console.warn(
            `[DeploymentController] No test script found for ${owner}/${repo}`,
          );
          return res.status(400).json({
            error: "No test script found.",
            details:
              'Your package.json must contain a "test" script to run automated tests.',
          });
        }
      }
    }

    // 2. Create execution record
    const executionId = generateId();
    const executionRecord = {
      id: executionId,
      projectId: plan.projectId,
      status: "PENDING",
      stage: "INIT",
      jenkinsBuildId: null,
      logs: [],
      plan: plan,
      startTime: new Date(),
    };

    await store.addExecution(executionRecord);

    console.log(
      `[DeploymentController] Triggering Jenkins job: ${plan.jenkinsJob}`,
    );
    try {
      const jobExists = await jenkinsExecutor.checkJobExists(plan.jenkinsJob);

      if (!jobExists) {
        console.log(
          `[DeploymentController] Job ${plan.jenkinsJob} not found. Attempting to auto-create...`,
        );
        const projects = await store.getProjects();
        const project = projects.find((p) => p.id === plan.projectId);
        if (project && project.cloneUrl) {
          await jenkinsExecutor.createJob(
            plan.jenkinsJob,
            project.cloneUrl,
            project.type,
          );
          console.log(
            `[DeploymentController] Job ${plan.jenkinsJob} created successfully.`,
          );
        } else {
          throw new Error(
            `Cannot create job: Project or Clone URL not found for ${plan.projectId}`,
          );
        }
      } else {
        const projects = await store.getProjects();
        const project = projects.find((p) => p.id === plan.projectId);
        if (project && project.cloneUrl) {
          console.log(
            `[DeploymentController] Job ${plan.jenkinsJob} exists. Updating config...`,
          );
          await jenkinsExecutor.updateJob(
            plan.jenkinsJob,
            project.cloneUrl,
            project.type,
          );
        }
      }

      await jenkinsExecutor.triggerBuild(plan.jenkinsJob, plan.jenkinsParams);
      executionRecord.status = "QUEUED";
      executionRecord.logs.push(
        `[${new Date().toISOString()}] [INFO] Jenkins Build Triggered Successfully`,
      );

      pollExecution(executionRecord, plan.jenkinsJob);
    } catch (jErr) {
      console.error("Jenkins Trigger Failed:", jErr);
      executionRecord.status = "FAILED";
      executionRecord.logs.push(
        `[${new Date().toISOString()}] [ERROR] Failed to trigger Jenkins: ${jErr.message}`,
      );
      executionRecord.endTime = new Date();
    }

    res.json({ executionId, status: executionRecord.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Background poller to track Jenkins execution and parse results.
 */
const pollExecution = async (executionRecord, jobName) => {
  console.log(`[Poller] Starting polling for ${jobName}...`);
  let attempts = 0;
  const maxAttempts = 120; // 10 minutes (5s interval)
  let buildId = null;

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  await delay(3000);

  const interval = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts) {
      clearInterval(interval);
      return;
    }

    try {
      if (!buildId) {
        const jobDetails = await jenkinsExecutor.getJobDetails(jobName);
        if (jobDetails.lastBuild) {
          buildId = jobDetails.lastBuild.number;
          executionRecord.jenkinsBuildId = buildId;
        }
      }

      if (buildId) {
        const [buildDetails, logText] = await Promise.all([
          jenkinsExecutor.getBuildDetails(jobName, buildId),
          jenkinsExecutor.getBuildLogs(jobName, buildId),
        ]);

        if (logText) executionRecord.logs = logText.split("\n");

        if (buildDetails.result) {
          executionRecord.status =
            buildDetails.result === "SUCCESS" ? "SUCCESS" : "FAILED";
          executionRecord.endTime = new Date();

          const testResults = {
            testsPassed: 0,
            testsFailed: 0,
            recommendation: "",
          };
          const passMatch = logText.match(/Tests:.*(\d+)\s+passed/);
          const failMatch = logText.match(/Tests:.*(\d+)\s+failed/);

          if (passMatch) testResults.testsPassed = parseInt(passMatch[1]);
          if (failMatch) testResults.testsFailed = parseInt(failMatch[1]);

          if (
            !testResults.testsPassed &&
            !testResults.testsFailed &&
            executionRecord.status === "SUCCESS"
          ) {
            testResults.recommendation = "Build passed successfully.";
          }

          if (testResults.testsFailed > 0) {
            testResults.recommendation = "Fix failing tests before deployment.";
          } else if (executionRecord.status === "FAILED") {
            testResults.recommendation =
              "Build failed. Check logs for syntax errors.";
          }

          executionRecord.testResults = testResults;

          // PERSIST completion to DB
          await store.addExecution(executionRecord);

          clearInterval(interval);
        } else {
          executionRecord.status = "IN_PROGRESS";
          // Optional: persist in-progress logs? Probably too noisy for every 5s poll.
        }
      }
    } catch (err) {
      console.error(`[Poller] Error: ${err.message}`);
    }
  }, 5000);
};

// GET /api/deploy/execution/:id
const getExecution = async (req, res) => {
  const { id } = req.params;
  const execution = await store.getExecution(id);
  if (!execution) return res.status(404).json({ error: "Execution not found" });
  res.json(execution);
};

// GET /api/deploy/history
const getHistory = async (req, res) => {
  try {
    const history = await store.getExecutions();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/deploy/:projectId
const deleteProjectJob = async (req, res) => {
  try {
    const { projectId } = req.params;
    const projects = await store.getProjects();
    const project = projects.find((p) => p.id === projectId);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    // 1. Delete from Jenkins if job exists
    if (project.jenkinsJob) {
      try {
        const jobExists = await jenkinsExecutor.checkJobExists(
          project.jenkinsJob,
        );
        if (jobExists) {
          await jenkinsExecutor.deleteJob(project.jenkinsJob);
          console.log(
            `[DeploymentController] Deleted Jenkins job: ${project.jenkinsJob}`,
          );
        }
      } catch (err) {
        console.warn(
          `[DeploymentController] Failed to delete Jenkins job ${project.jenkinsJob}:`,
          err.message,
        );
        // Continue with local cleanup even if Jenkins fails (e.g., job already gone)
      }
    }

    // 2. Clear local execution history for this project
    await store.clearProjectHistory(projectId);

    res.json({
      success: true,
      message: "Project job and history cleared successfully",
    });
  } catch (error) {
    console.error("Project deletion failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/deploy/sync-jenkins
const syncJenkinsHistory = async (req, res) => {
  try {
    const syncedCount = await performSync();
    if (res) res.json({ success: true, synced: syncedCount });
    return syncedCount;
  } catch (error) {
    console.error("Jenkins sync failed:", error);
    if (res) res.status(500).json({ success: false, error: error.message });
    throw error;
  }
};

const performSync = async () => {
  const projects = await store.getProjects();
  const jenkinsBuilds = await jenkinsExecutor.getAllBuildsHistory();
  const jobToIdMap = {};
  projects.forEach((p) => {
    if (p.jenkinsJob) jobToIdMap[p.jenkinsJob] = p.id;
  });
  let syncCount = 0;

  for (const jb of jenkinsBuilds) {
    const existing = await store.getExecution(jb.id);
    if (!existing) {
      const projectId = jobToIdMap[jb.projectId] || jb.projectId;
      await store.addExecution({
        id: jb.id,
        projectId: projectId,
        jenkinsBuildId: jb.buildNumber,
        status: jb.status,
        stage: "COMPLETED",
        logs: [`[INFO] Synced from Jenkins build #${jb.buildNumber}`],
        testSummary: jb.testSummary || null,
        plan: {
          action: (jb.params?.ACTION || "JENKINS_BUILD").toUpperCase(),
          targetEnv: jb.params?.ENV || "N/A",
          projectId: projectId,
          jenkinsJob: jb.projectId,
          jenkinsParams: jb.params || {},
        },
        startTime: jb.startTime,
        endTime: jb.endTime,
      });
      syncCount++;
    }
  }
  return syncCount;
};

module.exports = {
  getProjects,
  analyzeIntent,
  executePlan,
  getExecution,
  getHistory,
  deleteProjectJob,
  syncJenkinsHistory,
  pollExecution,
};
