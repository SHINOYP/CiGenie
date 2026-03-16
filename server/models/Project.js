const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    fullName: { type: String },
    repo: { type: String },
    description: { type: String },
    url: { type: String },
    cloneUrl: { type: String },
    defaultBranch: { type: String },
    jenkinsJob: { type: String },
    type: { type: String },
    environments: [{ type: String }],
    updatedAt: { type: Date },
    // Status tracking
    deployed: {
        dev: { type: Boolean, default: false },
        devPath: { type: String },
        devDate: { type: Date },
        production: { type: Boolean, default: false },
        productionPath: { type: String },
        productionDate: { type: Date },
        lastTestStatus: { type: String },
        lastTestDate: { type: Date },
        lastTestSummary: {
            passed: { type: Number },
            failed: { type: Number },
            total: { type: Number },
            snapshots: { type: Number },
            snapshotTotal: { type: Number }
        },
        isLocked: { type: Boolean, default: false },
        lockedPath: { type: String }
    }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
