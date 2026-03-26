import api from './api';

/**
 * Fetch all reports (optionally filtered by configId)
 */
export async function fetchReports(configId) {
  const params = configId ? { configId } : {};
  return api.get('/reports', { params });
}

/**
 * Fetch a single report by ID
 */
export async function fetchReport(id) {
  return api.get(`/reports/${id}`);
}

/**
 * Delete a report by ID
 */
export async function deleteReport(id) {
  return api.delete(`/reports/${id}`);
}

/**
 * Create GitHub Issues for selected results
 */
export async function createGitHubBugs(results, reportName, reportUrl) {
  return api.post('/bugs/github', { results, reportName, reportUrl });
}

/**
 * Create Jira issues for selected results
 */
export async function createJiraBugs(results, reportName, reportUrl) {
  return api.post('/bugs/jira', { results, reportName, reportUrl });
}

/**
 * Get which bug integrations are configured on the backend
 */
export async function getBugConfig() {
  return api.get('/bugs/config');
}

/**
 * Download a single row result as a JSON file (client-side, no server call)
 */
export function downloadRowAsJson(result, reportName) {
  const data = {
    reportName,
    caseName:         result.payloadName,
    edgeCaseType:     result.edgeCaseType || 'manual',
    status:           result.passed ? 'PASS' : 'FAIL',
    statusCode:       result.statusCode,
    statusText:       result.statusText,
    latencyMs:        result.latencyMs,
    requestPayload:   result.payloadBody,
    responseReceived: result.error ? { error: result.error } : result.response,
    exportedAt:       new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${(result.payloadName || 'result').replace(/\s+/g, '_')}_report.json`;
  a.click();
  URL.revokeObjectURL(url);
}