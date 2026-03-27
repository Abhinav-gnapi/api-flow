const axios = require('axios');
const ApiConfig = require('../models/ApiConfig.model');

const SUPPORTED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

function toObject(input) {
  if (!input) return null;
  if (typeof input === 'string') return JSON.parse(input);
  return input;
}

function toCollection(payload) {
  if (payload?.collection && Array.isArray(payload.collection.item)) return payload.collection;
  return payload;
}

function findBaseUrl(collection) {
  const vars = Array.isArray(collection.variable) ? collection.variable : [];
  const baseVar = vars.find((v) =>
    ['baseUrl', 'base_url', 'apiUrl', 'api_url', 'host'].includes(v?.key)
  );
  return typeof baseVar?.value === 'string' ? baseVar.value.trim() : '';
}

function extractRawUrl(urlValue) {
  if (!urlValue) return '';
  if (typeof urlValue === 'string') return urlValue;
  if (typeof urlValue.raw === 'string') return urlValue.raw;

  const protocol = typeof urlValue.protocol === 'string' ? `${urlValue.protocol}://` : '';
  const host = Array.isArray(urlValue.host) ? urlValue.host.join('.') : '';
  const path = Array.isArray(urlValue.path) ? `/${urlValue.path.join('/')}` : '';
  return `${protocol}${host}${path}`;
}

function extractPath(urlValue, rawUrl) {
  if (urlValue && typeof urlValue === 'object' && Array.isArray(urlValue.path) && urlValue.path.length) {
    return `/${urlValue.path.join('/')}`;
  }

  if (!rawUrl) return '/';

  const noQuery = rawUrl.split('?')[0];
  const withoutOrigin = noQuery.replace(/^[a-zA-Z]+:\/\/[^/]+/, '');

  if (withoutOrigin.startsWith('/')) return withoutOrigin;
  if (noQuery.startsWith('/')) return noQuery;

  if (noQuery.startsWith('{{')) {
    const slashIdx = noQuery.indexOf('/');
    if (slashIdx >= 0) return noQuery.slice(slashIdx);
  }

  return `/${noQuery.replace(/^\/+/, '')}`;
}

function hasJsonBody(request) {
  if (!request?.body) return false;
  const body = request.body;

  if (body.mode === 'raw' && typeof body.raw === 'string') {
    const trimmed = body.raw.trim();
    if (!trimmed) return false;
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  if (body.mode === 'graphql' && body.graphql) return true;
  return false;
}

function flattenItems(items, parents = []) {
  const endpoints = [];
  if (!Array.isArray(items)) return endpoints;

  for (const item of items) {
    const nameTrail = item?.name ? [...parents, item.name] : parents;

    if (Array.isArray(item?.item)) {
      endpoints.push(...flattenItems(item.item, nameTrail));
      continue;
    }

    if (!item?.request) continue;

    const method = String(item.request.method || 'GET').toUpperCase();
    if (!SUPPORTED_METHODS.has(method)) continue;

    const rawUrl = extractRawUrl(item.request.url);
    const path = extractPath(item.request.url, rawUrl);
    const summary = nameTrail.length ? nameTrail.join(' / ') : `${method} ${path}`;
    const folderTags = parents.length ? parents : [];

    endpoints.push({
      method,
      path,
      summary,
      operationId: item.id || '',
      parameters: [],
      requestBody: null,
      schema: hasJsonBody(item.request) ? { type: 'object' } : null,
      tags: folderTags,
      url: rawUrl,
    });
  }

  return endpoints;
}

function buildUrl(baseUrl, path, rawUrl) {
  if (rawUrl && /^https?:\/\//i.test(rawUrl)) return rawUrl;
  if (path && /^https?:\/\//i.test(path)) return path;
  if (!baseUrl) return path || '/';

  const left = String(baseUrl).replace(/\/+$/, '');
  const right = String(path || '/').replace(/^\/+/, '');
  return `${left}/${right}`;
}

exports.parsePostman = async (req, res, next) => {
  try {
    const { url, content } = req.body;
    if (!url && !content) {
      return res.status(400).json({ error: 'url or content is required' });
    }

    let payload;
    if (content) {
      payload = toObject(content);
    } else {
      const response = await axios.get(url, { timeout: 15000 });
      payload = toObject(response.data);
    }

    const collection = toCollection(payload);
    if (!collection || !Array.isArray(collection.item)) {
      return res.status(400).json({ error: 'Invalid Postman collection format' });
    }

    const endpoints = flattenItems(collection.item);

    res.json({
      title: collection.info?.name || 'Postman Collection',
      version:
        typeof collection.info?.version === 'string'
          ? collection.info.version
          : collection.info?.version?.raw || '2.1',
      baseUrl: findBaseUrl(collection),
      endpoints,
      total: endpoints.length,
    });
  } catch (err) {
    next(err);
  }
};

exports.importEndpoints = async (req, res, next) => {
  try {
    const { endpoints, baseUrl } = req.body;
    if (!Array.isArray(endpoints)) {
      return res.status(400).json({ error: 'endpoints array is required' });
    }

    const created = [];
    for (const ep of endpoints) {
      const method = String(ep.method || '').toUpperCase();
      if (!SUPPORTED_METHODS.has(method)) continue;

      const fullUrl = buildUrl(baseUrl, ep.path, ep.url);
      const config = await ApiConfig.create({
        name: ep.summary || `${method} ${ep.path || fullUrl}`,
        method,
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
