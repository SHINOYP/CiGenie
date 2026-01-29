const store = require('../models/store');

/**
 * Simulates the execution of a deployment pipeline.
 * Updates the execution record in the store with progress logs.
 * @param {string} executionId 
 */
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
            exec.endTime = new Date();
            clearInterval(interval);
            return;
        }

        const step = steps[currentStep];
        exec.logs.push(`[${new Date().toISOString()}] ${step.msg}`);
        
        // Randomly fail sometimes for demo (logic moved from controller)
        if (currentStep === 2 && Math.random() > 0.8) {
            exec.status = 'FAILED';
            exec.logs.push(`[${new Date().toISOString()}] [ERROR] Integration tests failed!`);
            exec.logs.push(`[${new Date().toISOString()}] [AI] Analyzing failure patterns...`);
            exec.endTime = new Date();
            clearInterval(interval);
            return;
        }

        currentStep++;
    }, 2000);
};

module.exports = {
    simulateExecution
};
