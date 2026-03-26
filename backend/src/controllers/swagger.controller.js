const SwaggerParser = require('@apidevtools/swagger-parser');
const ApiConfig = require('../models/ApiConfig.model');
const axios = require('axios');

/**
 * Fetch a swagger-ui-init.js file and extract the embedded spec object from it.
 * NestJS / Swagger UI writes the spec as:
 *   let options = { swaggerDoc: { openapi: "3.0.0", ... }, ... }
 * or as:
 *   const defined = { "openapi": "3.0.0", ... }
 * We try several known patterns.
 */
async function extractSpecFromInitJs(url) {
  const response = await axios.get(url, { timeout: 15000 });
  const js = response.data;

  // Pattern 1 — NestJS default: swaggerDoc: { ... }
  let match = js.match(/swaggerDoc\s*:\s*(\{[\s\S]*?\})\s*,?\s*\n?\s*(?:url|dom_id|deepLinking|spec)/);
  if (match) {
    try { return JSON.parse(match[1]); } catch {}
  }

  // Pattern 2 — broader swaggerDoc extraction (greedy up to closing of top-level object)
  match = js.match(/swaggerDoc\s*:\s*(\{)/);
  if (match) {
    // Walk forward to find the matching closing brace
    const start = js.indexOf(match[0]) + match[0].length - 1;
    const spec = extractBalancedJson(js, start);
    if (spec) {
      try { return JSON.parse(spec); } catch {}
    }
  }

  // Pattern 3 — spec: { openapi: ... } or "openapi":"3.0.0"
  match = js.match(/(?:spec|swaggerDoc)\s*[:=]\s*(\{[\s\S]{20,})/);
  if (match) {
    const spec = extractBalancedJson(js, js.indexOf(match[0]) + match[0].indexOf('{'));
    if (spec) {
      try { return JSON.parse(spec); } catch {}
    }
  }

  // Pattern 4 — the entire file might be a JSON assignment, e.g. window.onload = function(){ ... }
  // Try finding any top-level {"openapi": ...} or {"swagger": ...} block
  const openApiIdx = js.search(/"openapi"\s*:/);
  const swaggerIdx = js.search(/"swagger"\s*:/);
  const idx = openApiIdx !== -1 ? openApiIdx : swaggerIdx;
  if (idx !== -1) {
    // Walk back to find the opening {
    let bracePos = idx;
    while (bracePos > 0 && js[bracePos] !== '{') bracePos--;
    const spec = extractBalancedJson(js, bracePos);
    if (spec) {
      try { return JSON.parse(spec); } catch {}
    }
  }

  throw new Error(
    'Could not extract spec from swagger-ui-init.js. ' +
    'Try opening the file in your browser and look for a /api-json or /swagger.json path instead.'
  );
}

/**
 * Extract a balanced JSON object starting at `startIdx` in `str`.
 * Returns the JSON string or null.
 */
function extractBalancedJson(str, startIdx) {
  if (str[startIdx] !== '{') return null;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < str.length; i++) {
    const ch = str[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return str.slice(startIdx, i + 1);
    }
  }
  return null;
}

/**
 * Extract all endpoints from a parsed OpenAPI spec object.
 */
function extractEndpoints(api) {
  const endpoints = [];
  if (!api.paths) return endpoints;

  const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

  for (const [path, pathItem] of Object.entries(api.paths)) {
    for (const method of httpMethods) {
      if (!pathItem[method]) continue;
      const operation = pathItem[method];
      const endpoint = {
        method: method.toUpperCase(),
        path,
        summary: operation.summary || '',
        operationId: operation.operationId || '',
        parameters: operation.parameters || [],
        requestBody: operation.requestBody || null,
        schema: null,
        tags: operation.tags || [],
      };

      if (operation.requestBody?.content) {
        const jsonContent =
          operation.requestBody.content['application/json'] ||
          Object.values(operation.requestBody.content)[0];
        if (jsonContent?.schema) endpoint.schema = jsonContent.schema;
      }

      endpoints.push(endpoint);
    }
  }
  return endpoints;
}

/**
 * POST /api/swagger/parse
 * Body: { url } or { content: "yaml/json string" }
 *
 * Supports:
 *  - Direct JSON/YAML spec URLs
 *  - swagger-ui-init.js URLs (NestJS default)
 *  - Raw JSON/YAML content string
 */
exports.parseSwagger = async (req, res, next) => {
  try {
    const { url, content } = req.body;
    if (!url && !content) {
      return res.status(400).json({ error: 'url or content is required' });
    }

    let specObject;

    if (content) {
      // Raw content passed directly
      specObject = typeof content === 'string' ? JSON.parse(content) : content;

    } else if (url.endsWith('swagger-ui-init.js') || url.includes('swagger-ui-init')) {
      // Extract embedded spec from NestJS swagger-ui-init.js
      specObject = await extractSpecFromInitJs(url);

    } else {
      // Try direct parse first (standard JSON/YAML spec URL)
      try {
        specObject = await SwaggerParser.parse(url);
      } catch (directErr) {
        // If direct parse fails and URL looks like a UI page, try appending common spec paths
        if (url.includes('#') || url.endsWith('/api') || url.endsWith('/docs')) {
          const base = url.split('#')[0].replace(/\/$/, '');
          const candidates = [
            `${base}-json`,
            `${base}/swagger.json`,
            `${base}/openapi.json`,
            `${base.replace(/\/api$/, '')}/api-json`,
          ];

          let found = false;
          for (const candidate of candidates) {
            try {
              specObject = await SwaggerParser.parse(candidate);
              found = true;
              break;
            } catch {}
          }
          if (!found) throw directErr;
        } else {
          throw directErr;
        }
      }
    }

    // Validate / dereference
    let api;
    try {
      api = await SwaggerParser.parse(specObject);
    } catch {
      // If SwaggerParser can't handle it as an object, use it as-is
      api = specObject;
    }

    const endpoints = extractEndpoints(api);

    // Determine base URL
    let baseUrl = '';
    if (api.servers?.length) {
      baseUrl = api.servers[0].url;
    } else if (url) {
      // Derive base from the init.js URL: strip /api/swagger-ui-init.js → base
      baseUrl = url
        .replace(/\/swagger-ui-init\.js$/, '')
        .replace(/#.*$/, '')
        .replace(/\/api$/, '');
    }

    res.json({
      title:     api.info?.title   || 'API',
      version:   api.info?.version || '1.0',
      baseUrl,
      endpoints,
      total: endpoints.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/swagger/import
 * Import parsed endpoints as ApiConfigs
 */
exports.importEndpoints = async (req, res, next) => {
  try {
    const { endpoints, baseUrl } = req.body;
    if (!Array.isArray(endpoints)) {
      return res.status(400).json({ error: 'endpoints array is required' });
    }

    const created = [];
    for (const ep of endpoints) {
      const fullUrl = ep.path.startsWith('http') ? ep.path : `${baseUrl}${ep.path}`;
      const config = await ApiConfig.create({
        name: ep.summary || `${ep.method} ${ep.path}`,
        method: ep.method,
        url: fullUrl,
        headers: { 'Content-Type': 'application/json' },
      });
      created.push(config);
    }

    res.status(201).json({ created: created.length, configs: created });
  } catch (err) {
    next(err);
  }
};