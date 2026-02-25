const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    fullName: { type: String },
    url: { type: String },
    cloneUrl: { type: String },
    type: { type: String },
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
        lastTestSummary: { type: String },
        isLocked: { type: Boolean, default: false },
        lockedPath: { type: String }
    }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
