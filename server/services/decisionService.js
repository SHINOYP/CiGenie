const store = require('../models/store');

/**
 * Handlers for different intent actions
 */
const ACTION_HANDLERS = {
  DEPLOY: (decision) => {
    decision.jenkinsParams.ACTION = 'deploy';
    decision.jenkinsParams.ENV = 'production'; // Default to production for simplicity
    decision.reasoning.push('Standard deployment to production environment.');
    decision.autoExecute = true;
  },

  TEST: (decision) => {
    decision.jenkinsParams.ACTION = 'test';
    decision.jenkinsParams.ENV = 'dev'; 
    decision.reasoning.push('Running full test suite (Jest).');
    decision.autoExecute = true;
  },

  REDEPLOY: (decision) => {
    decision.jenkinsParams.ACTION = 'deploy';
    decision.jenkinsParams.ENV = 'production';
    decision.reasoning.push('Re-triggering deployment to production.');
    decision.autoExecute = true;
  }
};

/**
 * Analyzes the user's intent and generates an execution plan.
 */
const analyzeIntent = async (projectId, intent) => {
  const projects = await store.getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');

  // Initialize base decision structure
  const decision = {
    projectId,
    action: intent.action,
    targetEnv: intent.environment,
    timestamp: new Date(),
    reasoning: [],
    riskFlags: [],
    jenkinsJob: project.jenkinsJob,
    jenkinsParams: {
      GIT_REPO: project.cloneUrl,
      BRANCH: intent.branch || project.defaultBranch || 'main',
      OUTPUT_PATH: intent.outputPath || '/var/www/html'
    },
    projectType: project.type,
    confidenceScore: 1.0, // Default high confidence
    approvalRequired: false,
    autoExecute: false
  };

  // Find handler for the action
  const handler = ACTION_HANDLERS[intent.action];
  
  if (handler) {
    handler(decision, intent);
  } else {
    decision.confidenceScore = 0.5;
    decision.reasoning.push(`Unknown action type: ${intent.action}`);
  }

  return decision;
};

module.exports = {
  analyzeIntent
};
