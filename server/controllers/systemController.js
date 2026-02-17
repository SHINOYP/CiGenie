const store = require('../models/store');
const jenkinsExecutor = require('../services/executors/jenkinsExecutor');

// GET /api/system/stats
const getDashboardStats = (req, res) => {
    const executions = store.getExecutions();
    const totalBuilds = executions.length;

    const successCount = executions.filter(e => e.status === 'SUCCESS').length;
    const failedCount = executions.filter(e => e.status === 'FAILED').length;
    const successRate = totalBuilds > 0 ? ((successCount / totalBuilds) * 100).toFixed(1) + '%' : '0%';

    // Calculate Avg Duration
    let totalDurationMs = 0;
    let durationCount = 0;
    executions.forEach(e => {
        if (e.endTime && e.startTime) {
            totalDurationMs += (new Date(e.endTime) - new Date(e.startTime));
            durationCount++;
        }
    });

    let avgDuration = '0s';
    if (durationCount > 0) {
        const avgMs = totalDurationMs / durationCount;
        const avgSec = Math.floor(avgMs / 1000);
        if (avgSec < 60) avgDuration = `${avgSec}s`;
        else {
            const min = Math.floor(avgSec / 60);
            const sec = avgSec % 60;
            avgDuration = `${min}m ${sec}s`;
        }
    }

    res.json({
        totalBuilds,
        successRate,
        failedBuilds: failedCount,
        avgDuration
    });
};

// GET /api/system/status
const getSystemStatus = async (req, res) => {
    try {
        const jenkinsStatus = await jenkinsExecutor.getJenkinsStatus();
        res.json({
            jenkins: jenkinsStatus === 'Optimal' ? 'Connected' : 'Disconnected',
            executorStatus: 'Operational',
            jenkinsStatus: jenkinsStatus
        });
    } catch (error) {
        res.json({
            jenkins: 'Disconnected',
            executorStatus: 'Operational',
            jenkinsStatus: 'Error'
        });
    }
};

// GET /api/system/paths
const getFileSystemPaths = async (req, res) => {
    try {
        const paths = await jenkinsExecutor.getFileSystemPaths();
        res.json(paths);
    } catch (error) {
        console.error('Failed to fetch paths:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/system/insights
const getSystemRecommendations = (req, res) => {
    const executions = store.getExecutions();
    const recentFailures = executions.slice(0, 5).filter(e => e.status === 'FAILED');

    if (recentFailures.length >= 2) {
        res.json({
            type: 'warning',
            title: 'Failure Trend Detected',
            message: `Last ${recentFailures.length} builds failed. Suggest checking recent dependency updates or configuration changes.`
        });
    } else {
        res.json({
            type: 'info',
            title: 'System Healthy',
            message: 'Pipeline execution is stable. No immediate actions required.'
        });
    }
};

module.exports = {
    getDashboardStats,
    getSystemStatus,
    getFileSystemPaths,
    getSystemRecommendations
};
