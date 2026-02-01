const API_URL = 'http://127.0.0.1:4000/api';

const populate = async () => {
    try {
        console.log("1. Fetching Projects...");
        const pRes = await fetch(`${API_URL}/deploy/projects`);
        const projects = await pRes.json();
        if (projects.length === 0) { console.log("No projects."); return; }
        const projectId = projects[0].id;
        
        console.log(`2. Triggering Build for ${projectId}...`);
        const intentRes = await fetch(`${API_URL}/deploy/intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, action: 'DEPLOY', environment: 'dev', branch: 'main' })
        });
        const plan = await intentRes.json();
        
        const execRes = await fetch(`${API_URL}/deploy/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan })
        });
        const execData = await execRes.json();
        console.log(`3. Build Started: ${execData.executionId}`);
        
        console.log("4. Verifying History...");
        const hRes = await fetch(`${API_URL}/deploy/history`);
        const history = await hRes.json();
        console.log(`History Count: ${history.length}`);
        
    } catch(e) { console.error(e); }
};

populate();
