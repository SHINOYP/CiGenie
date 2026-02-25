const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
    githubUsername: { type: String, default: '' },
    githubToken: { type: String, default: '' }
}, { timestamps: true });

// We only want one config record
module.exports = mongoose.model('Config', ConfigSchema);
