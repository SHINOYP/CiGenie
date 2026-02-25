const express = require('express');
const cors = require('cors');
require('dotenv').config();


const webhookRoutes = require('./routes/webhooks');
const deployRoutes = require('./routes/deployments');
const configRoutes = require('./routes/config');
const systemRoutes = require('./routes/system');
const githubRoutes = require('./routes/github');

const app = express();
app.use('/api/tests', require('./routes/tests'));

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} in use, trying ${PORT + 1}...`);
    server.listen(PORT + 1, '0.0.0.0');
  }
});

app.use(cors());
app.use(express.json());

// Custom Colored Logger Middleware
app.use((req, res, next) => {
    const start = Date.now();
    const { method, url } = req;

    // Check status after response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;

        let color = '\x1b[32m'; // Green for 2xx
        if (status >= 300) color = '\x1b[36m'; // Cyan for 3xx
        if (status >= 400) color = '\x1b[33m'; // Yellow for 4xx
        if (status >= 500) color = '\x1b[31m'; // Red for 5xx
        const reset = '\x1b[0m';

        console.log(`${color}[${method}] ${url} - ${status} - ${duration}ms${reset}`);
    });

    next();
});

// Routes
app.use('/api/webhooks', webhookRoutes);
app.use('/api/deploy', deployRoutes);
app.use('/api/config', configRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/github', githubRoutes);

app.get('/', (req, res) => {
    res.send('CiGenie Control Plane is running');
});

/**
 * Initializes services and syncs data on startup
 */
const initialize = async () => {
    try {
        console.log('\x1b[36m%s\x1b[0m', '[System] Connecting to MongoDB...');
        const connectDB = require('./config/db');
        await connectDB();

        console.log('\x1b[36m%s\x1b[0m', '[System] Initializing configuration...');
        const githubService = require('./services/githubService');
        const jenkinsExecutor = require('./services/executors/jenkinsExecutor');
        const store = require('./models/store');

        // Initial project fetch
        await githubService.fetchProjects();
        console.log('\x1b[32m%s\x1b[0m', '[System] GitHub project synchronization complete');

        // Auto-sync Jenkins builds using the unified controller logic
        console.log('\x1b[36m%s\x1b[0m', '[System] Syncing Jenkins execution history...');
        const deploymentController = require('./controllers/deploymentController');
        const syncedCount = await deploymentController.syncJenkinsHistory();

        console.log('\x1b[32m%s\x1b[0m', `[System] Successfully synced ${syncedCount} legacy builds`);

    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', `[Critical] Initialization failed: ${error.message}`);
    }
};

initialize();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
