const mongoose = require('mongoose');

const ExecutionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    projectId: { type: String, required: true },
    status: { type: String, default: 'PENDING' },
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
    testSummary: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Execution', ExecutionSchema);
