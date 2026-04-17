const axios = require('axios');
const ApiConfig = require('../models/ApiConfig.model');
const Payload = require('../models/Payload.model');
const Report = require('../models/Report.model');
const { validateResponseSchema } = require('../utils/responseValidator');

const resolveSampleResponseDto = (requestBody, configSampleResponseDto) => {
  const hasOverride = Object.prototype.hasOwnProperty.call(requestBody || {}, 'sampleResponseDto');
  return hasOverride ? requestBody.sampleResponseDto : configSampleResponseDto;
};

/**
 * Execute a single payload against the API config
 */
const executePayload = async (config, payload, sampleResponseDto = null) => {
  const start = Date.now();
  try {
    const response = await axios({
      method: config.method.toLowerCase(),
      url: config.url,
      headers: config.headers || {},
      params: config.queryParams || {},
      data: payload.body || {},
      timeout: 30000,
      validateStatus: () => true, // Don't throw on 4xx/5xx
    });

    const latencyMs = Date.now() - start;
    const statusOk = response.status >= 200 && response.status < 300;

    // If sample response is provided, validate the response against it
    let passed = statusOk;
    let validationErrors = [];

    if (sampleResponseDto && statusOk) {
      const validation = validateResponseSchema(response.data, sampleResponseDto);
      passed = validation.passed;
      validationErrors = validation.errors;
    }

    return {
      payloadId: payload._id,
      payloadName: payload.name,
      payloadBody: payload.body,
      statusCode: response.status,
      statusText: response.statusText,
      latencyMs,
      passed,
      response: response.data,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      edgeCaseType: payload.edgeCaseType,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      payloadId: payload._id,
      payloadName: payload.name,
      payloadBody: payload.body,
      statusCode: 0,
      statusText: 'Network Error',
      latencyMs,
      passed: false,
      response: null,
      error: err.message,
      edgeCaseType: payload.edgeCaseType,
    };
  }
};

// POST /api/runner/run-one
exports.runOne = async (req, res, next) => {
  try {
    const { configId, payloadId } = req.body;

    const config = await ApiConfig.findById(configId);
    if (!config) return res.status(404).json({ error: 'Config not found' });

    const payload = await Payload.findById(payloadId);
    if (!payload) return res.status(404).json({ error: 'Payload not found' });

    const sampleResponseDto = resolveSampleResponseDto(req.body, config.sampleResponseDto);
    const result = await executePayload(config, payload, sampleResponseDto);

    // Update lastResult on payload
    await Payload.findByIdAndUpdate(payloadId, {
      lastResult: { ...result, runAt: new Date() },
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/runner/run-all
exports.runAll = async (req, res, next) => {
  try {
    const { configId, delayMs = 0 } = req.body;

    const config = await ApiConfig.findById(configId);
    if (!config) return res.status(404).json({ error: 'Config not found' });

    const payloads = await Payload.find({ configId });
    if (!payloads.length) return res.status(400).json({ error: 'No payloads found' });

    const sampleResponseDto = resolveSampleResponseDto(req.body, config.sampleResponseDto);
    const results = [];

    for (const payload of payloads) {
      const result = await executePayload(config, payload, sampleResponseDto);
      results.push(result);

      // Update lastResult on each payload
      await Payload.findByIdAndUpdate(payload._id, {
        lastResult: { ...result, runAt: new Date() },
      });

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Update lastRun on config
    await ApiConfig.findByIdAndUpdate(configId, { lastRun: new Date() });

    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;

    // Save report
    const report = await Report.create({
      configId,
      configName: config.name,
      method: config.method,
      url: config.url,
      totalPayloads: payloads.length,
      executed: results.length,
      passed,
      failed,
      results,
      runAt: new Date(),
    });

    res.json({ report, results, summary: { total: results.length, passed, failed } });
  } catch (err) {
    next(err);
  }
};
