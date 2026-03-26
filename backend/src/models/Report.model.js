const mongoose = require('mongoose');

const reportResultSchema = new mongoose.Schema({
  payloadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payload' },
  payloadName: String,
  payloadBody: mongoose.Schema.Types.Mixed,
  statusCode: Number,
  statusText: String,
  latencyMs: Number,
  passed: Boolean,
  response: mongoose.Schema.Types.Mixed,
  error: String,
  edgeCaseType: String,
});

const reportSchema = new mongoose.Schema(
  {
    configId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiConfig', required: true },
    configName: String,
    method: String,
    url: String,
    totalPayloads: Number,
    executed: Number,
    passed: Number,
    failed: Number,
    results: [reportResultSchema],
    runAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
