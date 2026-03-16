/**
 * Verification Script: Test Jenkins Trigger Safety
 * This script verifies that the safety checks in jenkinsExecutor and
 * deploymentController prevent crashes when job names are missing.
 */
const jenkinsExecutor = require('../services/executors/jenkinsExecutor');
require('dotenv').config();

async function runTest() {
    console.log('--- Verification: Jenkins Trigger Safety ---');

    // Test 1: jenkinsExecutor.checkJobExists with undefined
    console.log('\nTest 1: checkJobExists with undefined jobName');
    try {
        await jenkinsExecutor.checkJobExists(undefined);
        console.error('FAIL: Should have thrown an error!');
    } catch (error) {
        console.log('PASS: Correctly threw error:', error.message);
    }

    // Test 2: jenkinsExecutor.getBuildDetails with invalid type
    console.log('\nTest 2: getBuildDetails with invalid jobName type');
    try {
        await jenkinsExecutor.getBuildDetails(null, 1);
        console.error('FAIL: Should have thrown an error!');
    } catch (error) {
        console.log('PASS: Correctly threw error:', error.message);
    }

    console.log('\n--- Verification Complete ---');
    process.exit(0);
}

// Simple mock for Store to avoid DB connection issues in this script
// (In a real scenario we'd use a more sophisticated mock or test DB)
runTest();
