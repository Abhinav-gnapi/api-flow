const mongoose = require('mongoose');

const flowStepSchema = new mongoose.Schema({
  id: String,
  name: String,
  configId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiConfig' },
  method: String,
  url: String,
  headers: mongoose.Schema.Types.Mixed,
  body: mongoose.Schema.Types.Mixed,
  // Variable extraction: e.g. { "authToken": "$.data.token" }
  extractVariables: mongoose.Schema.Types.Mixed,
  // Variable injection: e.g. { "Authorization": "Bearer {{authToken}}" }
  injectVariables: mongoose.Schema.Types.Mixed,
  position: { x: Number, y: Number },
  nextStepId: String,
});

const flowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,

    // Applied to every step at runtime (unless overridden per-step).
    // Useful for "Authorization": "Bearer {{token}}" so you set it once.
    globalInjectVariables: mongoose.Schema.Types.Mixed,

    steps: [flowStepSchema],
    aiSuggestions: [mongoose.Schema.Types.Mixed],
    lastRunResult: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Flow', flowSchema);
