const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

dotenv.config({ path: path.join(__dirname, '../.env') });

const store = require('../models/store');
const jenkinsExecutor = require('../services/executors/jenkinsExecutor');

async function debugJenkinsDelete() {
    console.log("--- Jenkins Deletion Debugger ---");
    
    try {
        console.log("Connecting to Database...");
        const projects = await store.getProjects();
        console.log(`Found ${projects.length} projects.`);
        const baseUrl = await jenkinsExecutor.getBaseUrl();
        console.log(`Using Jenkins Base URL: ${baseUrl}`);
        
        for (const project of projects) {
            console.log(`\n--- Project: ${project.name} (ID: ${project.id}) ---`);
            console.log(`Jenkins Job Reference: ${project.jenkinsJob}`);
            
            if (!project.jenkinsJob) {
                console.log("No Jenkins job associated. Skipping.");
                continue;
            }

            try {
                const exists = await jenkinsExecutor.checkJobExists(project.jenkinsJob);
                console.log(`Job exists in Jenkins: ${exists}`);
                
                if (exists) {
                    console.log(`Attempting to delete: ${project.jenkinsJob}...`);
                    await jenkinsExecutor.deleteJob(project.jenkinsJob);
                    console.log(`Deletion command finished.`);
                    
                    // Verify if it's really gone
                    console.log("Waiting 2s for Jenkins to process...");
                    await new Promise(r => setTimeout(r, 2000));
                    const stillExists = await jenkinsExecutor.checkJobExists(project.jenkinsJob);
                    console.log(`Job exists after deletion attempt: ${stillExists}`);
                    
                    if (!stillExists) {
                        console.log("[SUCCESS] Job was deleted!");
                    } else {
                        console.log("[WARNING] Job is still there. HTTP request might have succeeded but deletion failed in Jenkins.");
                    }
                }
            } catch (err) {
                console.error(`Error processing job ${project.jenkinsJob}: ${err.message}`);
            }
        }
    } catch (error) {
        console.error("\n[CRITICAL ERROR] Debug script failed:", error);
        process.exit(1);
    }
}

debugJenkinsDelete().then(() => {
    console.log("\n--- Debug Session Finished ---");
    process.exit(0);
}).catch(err => {
    console.error("Unhanded rejection:", err);
    process.exit(1);
});
