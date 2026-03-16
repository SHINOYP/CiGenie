const mongoose = require('mongoose');

const ExecutionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    projectId: { type: String, required: true },
    status: { type: String, default: 'PENDING', enum: ['PENDING', 'QUEUED', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'UNSTABLE'] },
    stage: { type: String, default: 'INIT' },
    jenkinsBuildId: { type: Number },
    logs: [{ type: String }],
    plan: {
        action: { type: String },
        environment: { type: String },
        targetEnv: { type: String },
        branch: { type: String },
        outputPath: { type: String },
        projectId: { type: String },
        jenkinsJob: { type: String },
        jenkinsParams: { type: mongoose.Schema.Types.Mixed }
    },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    testResults: {
        testsPassed: { type: Number },
        testsFailed: { type: Number },
        recommendation: { type: String }
    },
    testSummary: {
        passed: { type: Number },
        failed: { type: Number },
        total: { type: Number },
        snapshots: { type: Number },
        snapshotTotal: { type: Number }
    },
    aiSummary: {
        headline:   { type: String },
        reason:     { type: String },
        suggestion: { type: String },
        type:       { type: String, enum: ['success', 'warning', 'error', 'info'] }
    }
}, { timestamps: true });

module.exports = mongoose.model('Execution', ExecutionSchema);
