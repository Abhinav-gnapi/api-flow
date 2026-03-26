const mongoose = require('mongoose');

const EDGE_CASE_TYPES = [
  'manual',
  'null_values',
  'sql_injection',
  'boundary',
  'type_mismatch',
  'security',
  'valid',
  'negative',
  'missing_fields',
  'extra_fields',
  'xss',
  'empty_values',
  'special_characters',
  'unicode',
];

const EDGE_CASE_TYPE_ALIASES = {
  missing_field: 'missing_fields',
  missing_required_fields: 'missing_fields',
  unexpected_fields: 'extra_fields',
  extra_field: 'extra_fields',
  extra_unexpected_fields: 'extra_fields',
  xss_payload: 'xss',
  script_injection: 'xss',
  sqli: 'sql_injection',
  null_undefined: 'null_values',
  null_or_undefined: 'null_values',
  boundary_violation: 'boundary',
  invalid_type: 'type_mismatch',
  type_confusion: 'type_mismatch',
  special_characters_and_unicode: 'special_characters',
  special_character: 'special_characters',
};

function normalizeEdgeCaseType(rawValue, fallback = 'negative') {
  if (rawValue === undefined || rawValue === null || rawValue === '') return fallback;

  const normalized = String(rawValue)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (EDGE_CASE_TYPES.includes(normalized)) return normalized;
  if (EDGE_CASE_TYPE_ALIASES[normalized]) return EDGE_CASE_TYPE_ALIASES[normalized];

  return fallback;
}

const payloadSchema = new mongoose.Schema(
  {
    configId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiConfig',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    body: { type: mongoose.Schema.Types.Mixed, default: {} },
    isAiGenerated: { type: Boolean, default: false },
    edgeCaseType: {
      type: String,
      enum: EDGE_CASE_TYPES,
      default: 'manual',
      set: (value) => normalizeEdgeCaseType(value, 'manual'),
    },
    lastResult: {
      statusCode: Number,
      latencyMs: Number,
      passed: Boolean,
      response: mongoose.Schema.Types.Mixed,
      error: String,
      runAt: Date,
    },
  },
  { timestamps: true }
);

payloadSchema.statics.normalizeEdgeCaseType = normalizeEdgeCaseType;

module.exports = mongoose.model('Payload', payloadSchema);
