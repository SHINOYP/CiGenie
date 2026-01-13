const express = require('express');
const cors = require('cors');
require('dotenv').config();

const webhookRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/webhooks', webhookRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Orchestrator is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
