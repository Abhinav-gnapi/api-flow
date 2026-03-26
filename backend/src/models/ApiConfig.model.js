const mongoose = require('mongoose');

const apiConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      default: 'POST',
    },
    url: { type: String, required: true },
    headers: { type: mongoose.Schema.Types.Mixed, default: {} },
    queryParams: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastRun: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApiConfig', apiConfigSchema);
