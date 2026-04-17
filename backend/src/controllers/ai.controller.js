const OpenAI = require('openai');
const Payload = require('../models/Payload.model');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MAX_EDGE_CASES = 120;
const MIN_COMPREHENSIVE_EDGE_CASES = 20;
const EDGE_CASE_BATCH_SIZE = 20;

async function callOpenAI(prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });
  return response.choices[0].message.content.trim();
}

function extractJSON(raw) {
  const stripped = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    const arrMatch = stripped.match(/\[[\s\S]*\]/);
    if (arrMatch) return JSON.parse(arrMatch[0]);

    const objMatch = stripped.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]);

    throw new Error('No valid JSON found in response');
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function estimateDtoComplexity(node, depth = 0) {
  if (depth > 4) return 1;
  if (Array.isArray(node)) {
    if (!node.length) return 1;
    return 1 + estimateDtoComplexity(node[0], depth + 1);
  }
  if (!isPlainObject(node)) return 1;

  const keys = Object.keys(node);
  if (!keys.length) return 1;

  return keys.reduce((sum, key) => sum + 1 + estimateDtoComplexity(node[key], depth + 1), 0);
}

function resolveRequestedCount(rawCount, dto) {
  const autoCount = Math.min(
    MAX_EDGE_CASES,
    Math.max(MIN_COMPREHENSIVE_EDGE_CASES, estimateDtoComplexity(dto) * 6)
  );
  const normalizedKeyword =
    typeof rawCount === 'string' ? rawCount.trim().toLowerCase() : rawCount;

  if (
    rawCount === undefined ||
    rawCount === null ||
    rawCount === '' ||
    normalizedKeyword === 'max' ||
    normalizedKeyword === 'all' ||
    normalizedKeyword === 'auto'
  ) {
    return autoCount;
  }

  const parsedCount = Number(typeof rawCount === 'string' ? rawCount.trim() : rawCount);
  if (!Number.isFinite(parsedCount) || parsedCount <= 0) return autoCount;
  return Math.min(MAX_EDGE_CASES, Math.floor(parsedCount));
}

function buildEdgeCasesPrompt({
  dto,
  method,
  url,
  batchCount,
  batchIndex,
  totalBatches,
  targetCount,
  existingNames = [],
}) {
  const minimumValidCases = Math.max(1, Math.floor(batchCount * 0.2));
  const duplicateHint = existingNames.length
    ? `Avoid duplicates with these existing case names:\n${existingNames.map((name) => `- ${name}`).join('\n')}\n`
    : '';

  return `You are an expert API tester and security engineer.
Generate ${batchCount} UNIQUE edge case payloads for a ${method} request to ${url}.
This is batch ${batchIndex + 1} of ${totalBatches}. Target total cases across all batches: ${targetCount}.

DTO:
${JSON.stringify(dto, null, 2)}

Requirements:
- Include BOTH passing and failing payloads.
- Include at least ${minimumValidCases} valid payloads expected to pass in this batch.
- Cover these categories comprehensively: null_values, empty_values, sql_injection, xss, boundary, type_mismatch, missing_fields, extra_fields, special_characters, unicode, negative, valid.
- Vary attack strings and edge conditions across fields and nested fields.
- Each payload must be materially different.
- body must always be a JSON object.
- Keep payloads realistic for API testing.
${duplicateHint}
Respond ONLY with valid JSON object:
{
  "edgeCases": [
    {
      "name": "descriptive test case name",
      "edgeCaseType": "one of [null_values,sql_injection,boundary,type_mismatch,security,valid,negative,missing_fields,extra_fields,xss,empty_values,special_characters,unicode]",
      "expectedOutcome": "pass or fail",
      "body": { "test": "payload object" },
      "description": "why this tests a specific edge case"
    }
  ]
}

No markdown. No explanation text. Return JSON only.`;
}

function normalizeEdgeCases(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (isPlainObject(parsed) && Array.isArray(parsed.edgeCases)) return parsed.edgeCases;
  return [];
}

function normalizeGeneratedEdgeCase(edgeCase, index) {
  const normalizedType = Payload.normalizeEdgeCaseType(edgeCase?.edgeCaseType, 'negative');
  const body = isPlainObject(edgeCase?.body) ? edgeCase.body : {};
  const name =
    typeof edgeCase?.name === 'string' && edgeCase.name.trim()
      ? edgeCase.name.trim()
      : `Generated edge case ${index + 1}`;
  const description =
    typeof edgeCase?.description === 'string' && edgeCase.description.trim()
      ? edgeCase.description.trim()
      : 'AI-generated edge case';

  return {
    name,
    edgeCaseType: normalizedType,
    body,
    description,
  };
}

function edgeCaseKey(edgeCase) {
  return `${edgeCase.edgeCaseType}::${JSON.stringify(edgeCase.body)}`;
}

function buildFallbackEdgeCases(dto) {
  const fallbackCases = [];
  const dtoObject = isPlainObject(dto) ? cloneJson(dto) : {};
  const keys = Object.keys(dtoObject);

  fallbackCases.push({
    name: 'Valid baseline payload',
    edgeCaseType: 'valid',
    body: dtoObject,
    description: 'Baseline valid payload based on the provided DTO.',
  });

  if (keys.length > 0) {
    const missingRequired = cloneJson(dtoObject);
    delete missingRequired[keys[0]];
    fallbackCases.push({
      name: `Missing field: ${keys[0]}`,
      edgeCaseType: 'missing_fields',
      body: missingRequired,
      description: `Tests behavior when required field "${keys[0]}" is omitted.`,
    });
  } else {
    fallbackCases.push({
      name: 'Type mismatch baseline',
      edgeCaseType: 'type_mismatch',
      body: { value: 12345 },
      description: 'Fallback failing payload for empty DTO definitions.',
    });
  }

  return fallbackCases;
}

function ensurePassFailCoverage(edgeCases, dto, targetCount) {
  const normalizedCases = [...edgeCases];
  const hasValidCase = normalizedCases.some((edgeCase) => edgeCase.edgeCaseType === 'valid');
  const hasFailingCase = normalizedCases.some((edgeCase) => edgeCase.edgeCaseType !== 'valid');

  if (hasValidCase && hasFailingCase) return normalizedCases.slice(0, targetCount);

  const fallbackCases = buildFallbackEdgeCases(dto);
  const seen = new Set(normalizedCases.map(edgeCaseKey));

  for (const fallbackCase of fallbackCases) {
    const key = edgeCaseKey(fallbackCase);
    if (!seen.has(key)) {
      normalizedCases.push(fallbackCase);
      seen.add(key);
    }
  }

  return normalizedCases.slice(0, targetCount);
}

/**
 * POST /api/ai/generate-edge-cases
 * Body: { configId, dto, method, url, count }
 */
exports.generateEdgeCases = async (req, res, next) => {
  try {
    const { configId, dto, method = 'POST', url = '', count } = req.body;

    if (!configId || !dto) {
      return res.status(400).json({ error: 'configId and dto are required' });
    }

    const requestedCount = resolveRequestedCount(count, dto);
    const totalBatches = Math.max(1, Math.ceil(requestedCount / EDGE_CASE_BATCH_SIZE));
    const uniqueCasesByKey = new Map();
    let lastRawResponse = null;

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
      if (uniqueCasesByKey.size >= requestedCount) break;

      const batchCount = Math.min(EDGE_CASE_BATCH_SIZE, requestedCount - uniqueCasesByKey.size);
      const existingNames = Array.from(uniqueCasesByKey.values())
        .slice(-25)
        .map((item) => item.name)
        .filter(Boolean);

      const prompt = buildEdgeCasesPrompt({
        dto,
        method,
        url,
        batchCount,
        batchIndex,
        totalBatches,
        targetCount: requestedCount,
        existingNames,
      });

      const raw = await callOpenAI(prompt);
      lastRawResponse = raw;

      let parsedBatch;
      try {
        parsedBatch = extractJSON(raw);
      } catch (e) {
        continue;
      }

      const edgeCases = normalizeEdgeCases(parsedBatch);
      edgeCases.forEach((edgeCase, index) => {
        const normalized = normalizeGeneratedEdgeCase(edgeCase, uniqueCasesByKey.size + index);
        const key = edgeCaseKey(normalized);
        if (!uniqueCasesByKey.has(key)) {
          uniqueCasesByKey.set(key, normalized);
        }
      });
    }

    const generatedCases = ensurePassFailCoverage(
      Array.from(uniqueCasesByKey.values()),
      dto,
      requestedCount
    );

    if (generatedCases.length === 0) {
      return res.status(500).json({
        error: 'AI did not return a valid edge cases array',
        raw: lastRawResponse,
      });
    }

    const payloadsToSave = generatedCases.map((ec) => ({
      configId,
      name: ec.name || 'Generated',
      body: ec.body || {},
      isAiGenerated: true,
      edgeCaseType: Payload.normalizeEdgeCaseType(ec.edgeCaseType, 'valid'),
    }));

    const saved = await Payload.insertMany(payloadsToSave);

    res.json({
      requestedCount,
      count: saved.length,
      payloads: saved,
      raw: generatedCases,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/analyze-flow
 * Analyze an API flow for business logic failures
 */
exports.analyzeFlow = async (req, res, next) => {
  try {
    const { steps } = req.body;
    if (!steps || !Array.isArray(steps)) {
      return res.status(400).json({ error: 'steps array is required' });
    }

    const prompt = `You are an expert API security and QA engineer. Analyze this API flow sequence and identify potential business logic failures, security vulnerabilities, and negative flow scenarios.

API Flow Steps:
${JSON.stringify(steps, null, 2)}

Provide your analysis as a JSON object with:
{
  "dependencies": [ { "from": "step name", "to": "step name", "dependency": "what data is passed" } ],
  "negativeFlows": [
    {
      "name": "scenario name",
      "description": "what happens if this fails",
      "affectedSteps": ["step names"],
      "severity": "high|medium|low",
      "testApproach": "how to test this"
    }
  ],
  "securityConcerns": [ { "concern": "...", "severity": "high|medium|low", "step": "step name" } ],
  "suggestions": [ "improvement suggestions" ]
}

Return ONLY valid JSON, no markdown.`;

    const raw = await callOpenAI(prompt);

    let analysis;
    try {
      analysis = extractJSON(raw);
    } catch (e) {
      return res.status(500).json({ error: 'AI returned invalid JSON', raw });
    }

    res.json(analysis);
  } catch (err) {
    next(err);
  }
};
