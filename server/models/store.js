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
      { upsert: true, new: true, setDefaultsOnInsert: true }
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
      githubToken: process.env.GITHUB_TOKEN || ''
    };
  }
  return config;
};

const setConfig = async (newConfig) => {
  await Config.findOneAndUpdate({}, newConfig, { upsert: true, new: true });
};

const addExecution = async (exec) => {
  const newExec = new Execution(exec);
  await newExec.save();

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
};

// Helper to keep project status in sync with history
const updateProjectStatusFromExec = async (projectId) => {
  const executions = await Execution.find({ projectId }).sort({ startTime: -1 });
  const project = await Project.findOne({ id: projectId });
  if (!project) return;

  const status = { ...project.deployed };

  // Update dev/prod status based on executions
  ['dev', 'production'].forEach(env => {
    const lastDeployment = executions.find(e =>
      e.status === 'SUCCESS' &&
      e.plan?.targetEnv === env &&
      ['DEPLOY', 'REDEPLOY', 'deploy'].includes(e.plan?.action)
    );
    if (lastDeployment) {
      status[env] = true;
      status[`${env}Path`] = lastDeployment.plan?.jenkinsParams?.OUTPUT_PATH;
      status[`${env}Date`] = lastDeployment.endTime || lastDeployment.startTime;
    }
  });

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
  getExecution,
  clearProjectHistory,
  updateProjectStatusFromExec
};
