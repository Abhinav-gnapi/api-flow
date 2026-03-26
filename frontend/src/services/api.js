import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ── API Configs ──────────────────────────────────────────────
export const configsApi = {
  getAll:  ()         => api.get('/configs'),
  getOne:  (id)       => api.get(`/configs/${id}`),
  create:  (data)     => api.post('/configs', data),
  update:  (id, data) => api.put(`/configs/${id}`, data),
  remove:  (id)       => api.delete(`/configs/${id}`),
};

// ── Payloads ─────────────────────────────────────────────────
export const payloadsApi = {
  getByConfig:    (configId)    => api.get('/payloads', { params: { configId } }),
  create:         (data)        => api.post('/payloads', data),
  bulkCreate:     (payloads)    => api.post('/payloads/bulk', { payloads }),
  update:         (id, data)    => api.put(`/payloads/${id}`, data),
  remove:         (id)          => api.delete(`/payloads/${id}`),
  removeByConfig: (configId)    => api.delete(`/payloads/config/${configId}`),
};

// ── Runner ───────────────────────────────────────────────────
export const runnerApi = {
  runOne: (configId, payloadId)       => api.post('/runner/run-one', { configId, payloadId }),
  runAll: (configId, delayMs = 300)   => api.post('/runner/run-all', { configId, delayMs }),
};

// ── Reports ──────────────────────────────────────────────────
export const reportsApi = {
  getByConfig: (configId) => api.get('/reports', { params: { configId } }),
  getOne:      (id)       => api.get(`/reports/${id}`),
  remove:      (id)       => api.delete(`/reports/${id}`),
};

// ── AI ───────────────────────────────────────────────────────
export const aiApi = {
  generateEdgeCases: (data) => api.post('/ai/generate-edge-cases', data),
  analyzeFlow:       (data) => api.post('/ai/analyze-flow', data),
};

// ── Swagger ──────────────────────────────────────────────────
export const swaggerApi = {
  parse:   (data) => api.post('/swagger/parse', data),
  import:  (data) => api.post('/swagger/import', data),
};

// ── Flows ────────────────────────────────────────────────────
export const flowsApi = {
  getAll:  ()         => api.get('/flows'),
  getOne:  (id)       => api.get(`/flows/${id}`),
  create:  (data)     => api.post('/flows', data),
  update:  (id, data) => api.put(`/flows/${id}`, data),
  remove:  (id)       => api.delete(`/flows/${id}`),
  run:     (id)       => api.post(`/flows/${id}/run`),
};

export default api;
