const OpenAI = require('openai');
const Payload = require('../models/Payload.model');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

/**
 * POST /api/ai/generate-edge-cases
 * Body: { configId, dto, method, url, count }
 */
exports.generateEdgeCases = async (req, res, next) => {
  try {
    const { configId, dto, method = 'POST', url = '', count = 10 } = req.body;

    if (!configId || !dto) {
      return res.status(400).json({ error: 'configId and dto are required' });
    }

    const prompt = `You are an expert API tester. Analyze the following JSON payload DTO and generate ${count} diverse edge case test payloads for a ${method} request to ${url}.

DTO:
${JSON.stringify(dto, null, 2)}

Generate edge cases covering:
1. Null/undefined values for each field
2. Empty strings and empty objects
3. SQL injection strings (e.g., "'; DROP TABLE users; --")
4. XSS payloads (e.g., "<script>alert(1)</script>")
5. Boundary violations (very large numbers, negative numbers, max string lengths)
6. Type mismatches (string where number expected, etc.)
7. Special characters and unicode
8. Missing required fields
9. Extra unexpected fields
10. Valid edge cases (minimum valid data, maximum valid data)

Respond ONLY with a valid JSON array wrapped in a JSON object like: { "edgeCases": [ ... ] }
Each item must have:
{
  "name": "descriptive test case name",
  "edgeCaseType": one of ["null_values","sql_injection","boundary","type_mismatch","security","valid","negative","missing_fields","extra_fields","xss","empty_values","special_characters","unicode"],
  "body": { ...the test payload... },
  "description": "why this tests a specific vulnerability or edge case"
}

Return ONLY the JSON object, no markdown, no explanation.`;

    const raw = await callOpenAI(prompt);

    let parsed;
    try {
      parsed = extractJSON(raw);
    } catch (e) {
      return res.status(500).json({ error: 'AI returned invalid JSON', raw });
    }

    // Support both { edgeCases: [...] } and a raw array
    const edgeCases = Array.isArray(parsed) ? parsed : parsed.edgeCases || [];

    if (!Array.isArray(edgeCases) || edgeCases.length === 0) {
      return res.status(500).json({ error: 'AI did not return a valid edge cases array', raw });
    }

    const payloadsToSave = edgeCases.map((ec) => ({
      configId,
      name: ec.name || 'Generated',
      body: ec.body || {},
      isAiGenerated: true,
      edgeCaseType: Payload.normalizeEdgeCaseType(ec.edgeCaseType, 'valid'),
    }));

    const saved = await Payload.insertMany(payloadsToSave);

    res.json({ count: saved.length, payloads: saved, raw: edgeCases });
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
