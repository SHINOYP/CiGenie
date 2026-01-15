const store = require('../models/store');

/**
 * Analyzes the user's intent and generates an execution plan.
 * This is where the future LLM integration will happen.
 */
const analyzeIntent = async (projectId, intent) => {
  const project = store.getProjects().find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');

  // Rule-based decision logic (Mocking AI)
  const decision = {
    projectId,
    action: intent.action,
    targetEnv: intent.environment,
    timestamp: new Date(),
    confidenceScore: 0.98, // High confidence for standard actions
    reasoning: [],
    riskFlags: [],
    jenkinsJob: project.jenkinsJob,
    jenkinsParams: {}
  };

  // Logic based on action
  switch (intent.action) {
    case 'DEPLOY':
      decision.jenkinsParams = {
        ACTION: 'deploy',
        ENV: intent.environment,
        BRANCH: intent.branch || 'main'
      };
      decision.reasoning.push(`Standard deployment to ${intent.environment}.`);
      
      if (intent.environment === 'production') {
        decision.confidenceScore = 0.85;
        decision.reasoning.push('Production deployment requires approval.');
        decision.riskFlags.push('PROD_DEPLOYMENT');
      }
      break;

    case 'ROLLBACK':
      decision.jenkinsParams = {
        ACTION: 'rollback',
        ENV: intent.environment,
        VERSION: intent.version || 'previous'
      };
      decision.reasoning.push('Reverting to last stable version.');
      decision.riskFlags.push('ROLLBACK_ACTION');
      break;

    case 'TEST':
      decision.jenkinsParams = {
        ACTION: 'test',
        SCOPE: 'full'
      };
      decision.reasoning.push('Running full test suite.');
      break;

    default:
      decision.confidenceScore = 0.5;
      decision.reasoning.push('Unknown action type.');
  }

  return decision;
};

module.exports = {
  analyzeIntent
};
