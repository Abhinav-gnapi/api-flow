const Flow = require('../models/Flow.model');
const axios = require('axios');

function normalizeAuthHeaderValue(rawValue) {
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (!trimmed) return '';

    try {
      const parsed = JSON.parse(trimmed);
      const normalized = normalizeAuthHeaderValue(parsed);
      return typeof normalized === 'string' && normalized.trim() ? normalized.trim() : trimmed;
    } catch {
      return trimmed;
    }
  }

  if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
    const directAuth = rawValue.Authorization ?? rawValue.authorization;
    if (typeof directAuth === 'string' && directAuth.trim()) return directAuth.trim();

    const tokenLikeValue =
      rawValue.token
      ?? rawValue.authToken
      ?? rawValue.access_token
      ?? rawValue.accessToken
      ?? rawValue.bearerToken;

    if (typeof tokenLikeValue === 'string' && tokenLikeValue.trim()) {
      const token = tokenLikeValue.trim();
      return /^Bearer\s+/i.test(token) ? token : `Bearer ${token}`;
    }
  }

  return rawValue;
}

// GET /api/flows
exports.getAll = async (req, res, next) => {
  try {
    const flows = await Flow.find().sort({ updatedAt: -1 });
    res.json(flows);
  } catch (err) {
    next(err);
  }
};

// GET /api/flows/:id
exports.getOne = async (req, res, next) => {
  try {
    const flow = await Flow.findById(req.params.id);
    if (!flow) return res.status(404).json({ error: 'Flow not found' });
    res.json(flow);
  } catch (err) {
    next(err);
  }
};

// POST /api/flows
exports.create = async (req, res, next) => {
  try {
    const flow = await Flow.create(req.body);
    res.status(201).json(flow);
  } catch (err) {
    next(err);
  }
};

// PUT /api/flows/:id
exports.update = async (req, res, next) => {
  try {
    const flow = await Flow.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!flow) return res.status(404).json({ error: 'Flow not found' });
    res.json(flow);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/flows/:id
exports.remove = async (req, res, next) => {
  try {
    await Flow.findByIdAndDelete(req.params.id);
    res.json({ message: 'Flow deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/flows/:id/run
 * Execute all steps in sequence, passing variables between them
 */
exports.runFlow = async (req, res, next) => {
  try {
    const flow = await Flow.findById(req.params.id);
    if (!flow) return res.status(404).json({ error: 'Flow not found' });

    const variables = {};
    const stepResults = [];

    for (const step of flow.steps) {
      let url     = step.url;
      let body    = JSON.parse(JSON.stringify(step.body || {}));
      let headers = JSON.parse(JSON.stringify(step.headers || {}));

      // ── STEP 1: merge flow + step injectVariables into headers ──
      // globalInjectVariables (flow-level): { "Authorization": "Bearer {{token}}" }
      // injectVariables       (step-level): { "Authorization": "Bearer {{token}}" }
      // Step-level values override flow-level values.
      const mergedInjectVariables = {
        ...(flow.globalInjectVariables && typeof flow.globalInjectVariables === 'object' ? flow.globalInjectVariables : {}),
        ...(step.injectVariables && typeof step.injectVariables === 'object' ? step.injectVariables : {}),
      };

      for (const [key, val] of Object.entries(mergedInjectVariables)) {
        const isAuthHeader = key.toLowerCase() === 'authorization';
        headers[key] = isAuthHeader ? normalizeAuthHeaderValue(val) : val; // will be resolved in step 2
      }

      // ── STEP 2: replace {{variableName}} placeholders everywhere ─
      const replaceVars = (obj) => {
        if (typeof obj === 'string') {
          return obj.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '');
        }
        if (typeof obj === 'object' && obj !== null) {
          return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, replaceVars(v)])
          );
        }
        return obj;
      };

      url     = replaceVars(url);
      body    = replaceVars(body);
      headers = replaceVars(headers);

      const start = Date.now();
      let result;

      try {
        const response = await axios({
          method: step.method.toLowerCase(),
          url,
          headers,
          data: body,
          validateStatus: () => true,
          timeout: 30000,
        });

        const latencyMs = Date.now() - start;

        // Extract variables from response
        if (step.extractVariables) {
          for (const [varName, path] of Object.entries(step.extractVariables)) {
            const keys = path.replace(/^\$\./, '').split('.');
            let val = response.data;
            for (const key of keys) {
              val = val?.[key];
            }
            if (val !== undefined) variables[varName] = val;
          }
        }

        result = {
          stepId: step.id,
          stepName: step.name,
          url,
          method: step.method,
          requestBody: body,
          statusCode: response.status,
          statusText: response.statusText,
          latencyMs,
          passed: response.status >= 200 && response.status < 300,
          response: response.data,
          extractedVariables: step.extractVariables ? { ...variables } : {},
        };
      } catch (err) {
        result = {
          stepId: step.id,
          stepName: step.name,
          url,
          method: step.method,
          requestBody: body,
          statusCode: 0,
          statusText: 'Network Error',
          latencyMs: Date.now() - start,
          passed: false,
          response: null,
          error: err.message,
        };
      }

      stepResults.push(result);
    }

    const runResult = {
      flowId: flow._id,
      flowName: flow.name,
      steps: stepResults,
      totalSteps: stepResults.length,
      passedSteps: stepResults.filter((s) => s.passed).length,
      failedSteps: stepResults.filter((s) => !s.passed).length,
      runAt: new Date(),
    };

    await Flow.findByIdAndUpdate(req.params.id, { lastRunResult: runResult });
    res.json(runResult);
  } catch (err) {
    next(err);
  }
};
