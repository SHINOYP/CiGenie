const express = require('express');
const cors = require('cors');
require('dotenv').config();

const webhookRoutes = require('./routes/webhooks');
const deployRoutes = require('./routes/deployments');
const configRoutes = require('./routes/config');
const systemRoutes = require('./routes/system');
const githubRoutes = require('./routes/github');

const requestLogger = require('./middleware/requestLogger');
const initialize = require('./config/initializer');

const app = express();
const PORT = process.env.PORT || 4040;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/webhooks', webhookRoutes);
app.use('/api/deploy', deployRoutes);
app.use('/api/config', configRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/github', githubRoutes);

app.get('/', (req, res) => {
    res.send('CiGenie Control Plane is running');
});

initialize();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
