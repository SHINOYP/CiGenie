const Project = require('./Project');
const Execution = require('./Execution');
const Config = require('./Config');

const getProjects = async () => {
  return await Project.find().lean();
};

const setProjects = async (newProjects) => {
  // Upsert projects based on ID
  for (const projectData of newProjects) {
    await Project.findOneAndUpdate(
      { id: projectData.id },
      projectData,
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }
};

const getExecutions = async () => {
  return await Execution.find().sort({ startTime: -1 }).limit(100).lean();
};

const getConfig = async () => {
  let config = await Config.findOne();
  if (!config) {
    // Fallback to Env if not in DB
    return {
      githubUsername: process.env.GITHUB_USERNAME || '',
      githubToken: process.env.GITHUB_TOKEN || '',
      jenkinsUrl: process.env.JENKINS_URL || '',
      jenkinsUser: process.env.JENKINS_USER || '',
      jenkinsToken: process.env.JENKINS_TOKEN || '',
      geminiApiKey: process.env.GEMINI_API_KEY || ''
    };
  }
  return config;
};

const setConfig = async (newConfig) => {
  await Config.findOneAndUpdate({}, newConfig, { upsert: true, returnDocument: 'after' });
};

const addExecution = async (exec) => {
  const newExec = new Execution(exec);
  await newExec.save();

  // Update project deployment status if it's a deployment action
  if (exec.plan && exec.plan.projectId) {
    await updateProjectStatusFromExec(exec.plan.projectId);
  }
};

// Upsert: update an existing execution by id, or insert if new
const updateExecution = async (exec) => {
  await Execution.findOneAndUpdate(
    { id: exec.id },
    exec,
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  // Update project deployment status if it's a deployment action
  if (exec.plan && exec.plan.projectId) {
    await updateProjectStatusFromExec(exec.plan.projectId);
  }
};

const getExecution = async (id) => {
  return await Execution.findOne({ id }).lean();
};

const clearProjectHistory = async (projectId) => {
  await Execution.deleteMany({ projectId });
  await updateProjectStatusFromExec(projectId);
};

const deleteProject = async (projectId) => {
  // Clear execution history
  await Execution.deleteMany({ projectId });

  // Reset project status and clear Jenkins job reference
  await Project.updateOne({ id: projectId }, {
    jenkinsJob: null,
    deployed: {
      dev: false,
      devPath: null,
      devDate: null,
      production: false,
      productionPath: null,
      productionDate: null,
      lastTestStatus: null,
      lastTestDate: null,
      lastTestSummary: null,
      isLocked: false,
      lockedPath: null
    }
  });
};

// Helper to keep project status in sync with history
const updateProjectStatusFromExec = async (projectId) => {
  const executions = await Execution.find({ projectId }).sort({ startTime: -1 });
  const project = await Project.findOne({ id: projectId });
  if (!project) return;

  // Initialize status with defaults instead of merging with old state
  // This ensures that if history is cleared, the project status is reset.
  const status = {
    dev: false,
    devPath: null,
    devDate: null,
    production: false,
    productionPath: null,
    productionDate: null,
    lastTestStatus: null,
    lastTestDate: null,
    lastTestSummary: null,
    isLocked: false,
    lockedPath: null
  };

  // Update dev/prod status based  // Deploy status (consolidated)
  const lastDeployment = executions.find(e =>
    ['DEPLOY', 'deploy', 'REDEPLOY', 'redeploy'].includes(e.plan?.action) &&
    e.status === 'SUCCESS'
  );

  if (lastDeployment) {
    status.production = true;
    status.productionPath = lastDeployment.plan?.jenkinsParams?.OUTPUT_PATH;
    status.productionDate = lastDeployment.endTime || lastDeployment.startTime;

    // Also set dev for legacy compatibility if needed, or just leave it
    status.dev = true;
    status.devPath = status.productionPath;
    status.devDate = status.productionDate;
  }

  // Last test status
  const lastTest = executions.find(e =>
    ['test', 'TEST'].includes(e.plan?.action) &&
    e.status && e.status !== 'IN_PROGRESS'
  );
  if (lastTest) {
    status.lastTestStatus = lastTest.status;
    status.lastTestDate = lastTest.endTime || lastTest.startTime;
    status.lastTestSummary = lastTest.testSummary;
  }

  // Lock status
  const anyDeployment = executions.find(e => e.plan?.jenkinsParams?.OUTPUT_PATH);
  if (anyDeployment) {
    status.isLocked = true;
    status.lockedPath = anyDeployment.plan.jenkinsParams.OUTPUT_PATH;
  }

  await Project.updateOne({ id: projectId }, { deployed: status });
};

module.exports = {
  getProjects,
  setProjects,
  getExecutions,
  getConfig,
  setConfig,
  addExecution,
  updateExecution,
  getExecution,
  deleteProject,
  clearProjectHistory,
  updateProjectStatusFromExec
};
