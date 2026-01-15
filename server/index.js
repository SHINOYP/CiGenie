const express = require('express');
const cors = require('cors');
require('dotenv').config();

const webhookRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 4040;

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
app.use('/api/deploy', require('./routes/deployments'));

app.get('/', (req, res) => {
  res.send('AI CI/CD Backend is running');
});

// Initialize GitHub Service
const githubService = require('./services/githubService');
githubService.fetchProjects().then(() => {
    console.log('Initial project fetch complete');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
