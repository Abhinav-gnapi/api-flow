import { useState, useEffect, useRef } from 'react';
import {
  Trash2, Bug, FileDown, Github, ExternalLink,
  Loader2, CheckSquare, Square, Download, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchReports, deleteReport,
  createGitHubBugs, createJiraBugs,
  getBugConfig, downloadRowAsJson,
} from '../services/reportService';

const DELETE_CONFIRM_TOAST = {
  box: {
    minWidth: 320,
    maxWidth: 'min(92vw, 420px)',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    boxShadow: '0 12px 24px rgba(0,0,0,0.14)',
    padding: '12px 14px',
  },
  title: {
    fontSize: 'var(--type-body2-font-size)',
    fontWeight: 600,
    lineHeight: 'var(--type-body2-line-height)',
    letterSpacing: 'var(--type-body2-letter-spacing)',
    color: 'var(--text-primary)',
  },
  text: {
    fontSize: 'var(--type-caption-font-size)',
    fontWeight: 'var(--type-caption-font-weight)',
    lineHeight: 'var(--type-caption-line-height)',
    letterSpacing: 'var(--type-caption-letter-spacing)',
    color: 'var(--text-secondary)',
    marginTop: 4,
    wordBreak: 'break-word',
  },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  btn: {
    border: '1px solid transparent',
    borderRadius: 8,
    fontSize: 'var(--type-button-font-size)',
    fontWeight: 'var(--type-button-font-weight)',
    lineHeight: 'var(--type-button-line-height)',
    letterSpacing: 'var(--type-button-letter-spacing)',
    textTransform: 'var(--type-button-text-transform)',
    padding: '5px 12px',
    cursor: 'pointer',
  },
  cancelBtn: { borderColor: '#e5e7eb', color: 'var(--text-secondary)', background: 'transparent' },
  deleteBtn: { borderColor: '#ef4444', color: '#fff', background: '#ef4444' },
};

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
function rowAvgLatency(report) {
  const lats = (report.results || []).map(r => r.latencyMs).filter(Boolean);
  return lats.length ? Math.round(lats.reduce((a, b) => a + b, 0) / lats.length) : null;
}
function escapeHtml(value) {
  return String(value ?? '-')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\'/g, '&#39;');
}

function formatReportJson(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */
function LatencyBadge({ ms }) {
  if (ms === null || ms === undefined) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const color = ms < 500 ? '#16a34a' : ms < 1500 ? '#d97706' : '#dc2626';
  return (
    <span
      style={{
        color,
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 'var(--type-body2-font-size)',
        fontWeight: 600,
        lineHeight: 'var(--type-body2-line-height)',
        letterSpacing: 'var(--type-body2-letter-spacing)',
      }}
    >
      {ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`}
    </span>
  );
}

function StatCard({ label, value, sub, subColor, valueColor }) {
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #ACB1C6' }}>
      <div
        style={{
          fontSize: 'var(--type-h6-font-size)',
          fontWeight: 'var(--type-h6-font-weight)',
          lineHeight: 'var(--type-h6-line-height)',
          letterSpacing: 'var(--type-h6-letter-spacing)',
          color: 'var(--text-primary)',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 'var(--type-h4-font-size)',
          fontWeight: 'var(--type-h4-font-weight)',
          lineHeight: 'var(--type-h4-line-height)',
          letterSpacing: 'var(--type-h4-letter-spacing)',
          color: valueColor || 'var(--text-primary)',
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 'var(--type-caption-font-size)',
            fontWeight: 'var(--type-caption-font-weight)',
            lineHeight: 'var(--type-caption-line-height)',
            letterSpacing: 'var(--type-caption-letter-spacing)',
            color: subColor || 'var(--text-secondary)',
            marginTop: 6,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PDF download
   - Opens print dialog in a new tab
   - Listens for `afterprint` event → closes the tab automatically
   - Works whether user saves or cancels the dialog
───────────────────────────────────────────────────────────── */
function downloadReportPDF(report) {
  const rowAvg = rowAvgLatency(report);
  const safeConfigName = escapeHtml(report.configName);
  const safeMethod = escapeHtml(report.method);
  const safeUrl = escapeHtml(report.url);
  const safeRunAt = escapeHtml(new Date(report.runAt).toLocaleString());

  const resultRows = (report.results || []).map((r, i) => {
    const payloadBody = escapeHtml(formatReportJson(r.payloadBody));
    const responseBody = escapeHtml(
      typeof r.error === 'string'
        ? r.error
        : formatReportJson(r.response)
    );
    const payloadName = escapeHtml(r.payloadName || '-');
    const edgeCaseType = escapeHtml(r.edgeCaseType || '-');
    const statusText = escapeHtml(r.statusText || '');

    return `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'};border-left:3px solid ${r.passed ? '#22c55e' : '#ef4444'}">
      <td style="padding:10px 14px;font-weight:600;font-size:13px">${payloadName}</td>
      <td style="padding:10px 14px;font-size:12px;font-family:monospace">${edgeCaseType}</td>
      <td style="padding:10px 14px;font-size:12px;font-family:monospace">${r.statusCode} ${statusText}</td>
      <td style="padding:10px 14px;font-size:12px;font-family:monospace">${r.latencyMs ?? '-'}ms</td>
      <td style="padding:10px 14px;font-weight:700;font-size:12px;color:${r.passed ? '#16a34a' : '#dc2626'}">${r.passed ? 'PASS' : 'FAIL'}</td>
    </tr>
    <tr style="background:${r.passed ? '#f0fdf4' : '#fff5f5'}">
      <td colspan="5" style="padding:8px 14px 14px 32px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:capitalize;margin-bottom:4px">Request Payload</div>
            <pre style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px;font-size:11px;overflow:visible;white-space:pre-wrap;word-break:break-word">${payloadBody}</pre>
          </div>
          <div>
            <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:capitalize;margin-bottom:4px">Response</div>
            <pre style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px;font-size:11px;overflow:visible;white-space:pre-wrap;word-break:break-word">${responseBody}</pre>
          </div>
        </div>
      </td>
    </tr>
  `;
  }).join('');

  const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Report - ${safeConfigName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #fff; color: #111827; padding: 40px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .meta { font-size: 12px; color: #6b7280; margin-bottom: 24px; font-family: monospace; }
    .summary { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .chip { padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .chip-pass    { background: #dcfce7; color: #16a34a; }
    .chip-fail    { background: #fee2e2; color: #dc2626; }
    .chip-neutral { background: #f3f4f6; color: #374151; }
    .progress-bar  { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-bottom: 28px; }
    .progress-fill { height: 100%; background: #22c55e; border-radius: 4px; width: ${report.totalPayloads > 0 ? (report.passed / report.totalPayloads) * 100 : 0}%; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: capitalize; letter-spacing: 0.5px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Report - ${safeConfigName}</h1>
  <div class="meta">${safeMethod} ${safeUrl} &nbsp;-&nbsp; Run: ${safeRunAt}</div>
  <div class="summary">
    <span class="chip chip-neutral">Total: ${report.totalPayloads}</span>
    <span class="chip chip-neutral">Executed: ${report.executed}</span>
    <span class="chip chip-pass">Passed: ${report.passed}</span>
    <span class="chip chip-fail">Failed: ${report.failed}</span>
    ${rowAvg !== null ? `<span class="chip chip-neutral">Avg Latency: ${rowAvg}ms</span>` : ''}
  </div>
  <div class="progress-bar"><div class="progress-fill"></div></div>
  <table>
    <thead>
      <tr><th>Payload Name</th><th>Edge Case</th><th>Status</th><th>Latency</th><th>Result</th></tr>
    </thead>
    <tbody>${resultRows}</tbody>
  </table>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const printWindow = iframe.contentWindow;
  if (!printWindow) {
    iframe.remove();
    toast.error('Unable to open print preview');
    return;
  }

  const cleanup = () => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  };

  printWindow.document.open();
  printWindow.document.write(printHtml);
  printWindow.document.close();

  const onAfterPrint = () => {
    printWindow.removeEventListener('afterprint', onAfterPrint);
    cleanup();
  };

  printWindow.addEventListener('afterprint', onAfterPrint);

  // Fallback cleanup for browsers that don't reliably emit afterprint.
  setTimeout(cleanup, 60000);

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 80);
}

/* ─────────────────────────────────────────────────────────────
   BugModal
───────────────────────────────────────────────────────────── */
function BugModal({ reports, bugConfig, onClose }) {
  const failedResults = reports.flatMap(rep =>
    (rep.results || [])
      .filter(r => !r.passed)
      .map(r => ({ ...r, _reportName: rep.configName }))
  );

  const [platform,   setPlatform]   = useState(bugConfig?.github ? 'github' : 'jira');
  const [submitting, setSubmitting] = useState(false);
  const [created,    setCreated]    = useState([]);

  const handleSubmit = async () => {
    if (!failedResults.length) { toast.error('No failed results in selected reports'); return; }
    setSubmitting(true);
    try {
      const fn  = platform === 'github' ? createGitHubBugs : createJiraBugs;
      const res = await fn(failedResults, reports.map(r => r.configName).join(', '), window.location.href);
      setCreated(res.created || []);
      toast.success(`${res.count} ticket${res.count !== 1 ? 's' : ''} created!`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: 500, maxHeight: '82vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb' }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <Bug size={16} color="#ef4444" />
          <span style={{ fontSize: 'var(--type-subtitle2-font-size)', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>File Bug Tickets</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'github', label: 'GitHub Issues', icon: <Github size={14} />, info: bugConfig?.githubRepo },
              { key: 'jira',   label: 'Jira',          icon: <Bug size={14} />,    info: bugConfig?.jiraProject ? `Project: ${bugConfig.jiraProject}` : null },
            ].map(({ key, label, icon, info }) => {
              const configured = bugConfig?.[key];
              const active     = platform === key;
              return (
                <button key={key} onClick={() => configured && setPlatform(key)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${active ? '#7c3aed' : '#e5e7eb'}`, background: active ? '#f5f3ff' : '#fafafa', color: active ? '#7c3aed' : '#6b7280', fontSize: 'var(--type-body2-font-size)', fontWeight: 500, cursor: configured ? 'pointer' : 'not-allowed', opacity: configured ? 1 : 0.45, flexWrap: 'wrap' }}>
                  {icon} {label}
                  {info && configured
                    ? <span style={{ fontSize: 10, color: '#16a34a', marginLeft: 'auto', fontFamily: 'monospace' }}>{info}</span>
                    : !configured && <span style={{ fontSize: 10, color: '#d97706', marginLeft: 'auto' }}>Not configured</span>}
                </button>
              );
            })}
          </div>

          <div>
            <p style={{ fontSize: 'var(--type-caption-font-size)', color: 'var(--text-secondary)', marginBottom: 8 }}>
              Filing <strong>{failedResults.length}</strong> failed test case{failedResults.length !== 1 ? 's' : ''} from <strong>{reports.length}</strong> selected run{reports.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {failedResults.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: '#fafafa', border: '1px solid #f3f4f6', borderRadius: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                  <span style={{ fontSize: 'var(--type-caption-font-size)', color: 'var(--text-primary)', flex: 1 }}>{r.payloadName}</span>
                  <span style={{ fontSize: 'var(--type-overline-font-size)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r._reportName}</span>
                  <span style={{ fontSize: 'var(--type-overline-font-size)', fontFamily: 'monospace', color: '#dc2626', fontWeight: 600 }}>{r.statusCode}</span>
                </div>
              ))}
              {failedResults.length === 0 && (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--type-body2-font-size)' }}>No failed results in selected reports</div>
              )}
            </div>
          </div>

          {created.length > 0 && (
            <div style={{ paddingTop: 10, borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {created.map((c, i) => (
                <a key={i} href={c.issueUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--type-caption-font-size)', color: '#7c3aed', fontFamily: 'monospace', textDecoration: 'none' }}>
                  <ExternalLink size={11} /> {c.issueKey || `#${c.issueNumber}`} — {c.payloadName}
                </a>
              ))}
            </div>
          )}

          {!bugConfig?.github && !bugConfig?.jira && (
            <div style={{ padding: '10px 12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, fontSize: 'var(--type-caption-font-size)', color: '#92400e', lineHeight: 1.6 }}>
              ⚠️ No integrations configured. Add <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3 }}>GITHUB_TOKEN</code> or{' '}
              <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3 }}>JIRA_*</code> vars to your backend <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3 }}>.env</code>.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: '1px solid #f3f4f6' }}>
          <button onClick={onClose} style={{ padding: '7px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: 'var(--text-secondary)', fontSize: 'var(--type-body2-font-size)', cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (!bugConfig?.github && !bugConfig?.jira) || created.length > 0 || !failedResults.length}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 18px', background: '#ef4444', border: 'none', borderRadius: 8, color: '#fff', fontSize: 'var(--type-body2-font-size)', fontWeight: 600, cursor: 'pointer', opacity: (submitting || (!bugConfig?.github && !bugConfig?.jira) || created.length > 0 || !failedResults.length) ? 0.5 : 1 }}
          >
            {submitting ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Bug size={14} />}
            {created.length > 0 ? 'Filed!' : `File on ${platform === 'github' ? 'GitHub' : 'Jira'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ResultsDrawer
───────────────────────────────────────────────────────────── */
function ResultsDrawer({ report, onClose }) {
  const [filter, setFilter] = useState('all');
  const rows = (report.results || []).filter(r => {
    if (filter === 'pass') return r.passed;
    if (filter === 'fail') return !r.passed;
    return true;
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.25)', display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '72%', maxWidth: 960, height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 28px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{report.configName}</div>
            <div style={{ fontSize: 'var(--type-overline-font-size)', color: 'var(--text-muted)', marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>{report.method} {report.url}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {['all', 'pass', 'fail'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid', borderColor: filter === f ? '#7c3aed' : '#e5e7eb', background: filter === f ? '#7c3aed' : '#fff', color: filter === f ? '#fff' : '#6b7280', fontSize: 'var(--type-caption-font-size)', fontWeight: 600, cursor: 'pointer' }}>
                {f === 'all' ? `All (${report.results?.length ?? 0})` : f === 'pass' ? '✓ Pass' : '✕ Fail'}
              </button>
            ))}
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 18, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', position: 'sticky', top: 0, zIndex: 1 }}>
                {['Payload Name', 'Edge Case', 'Status', 'Latency', 'Result', 'Download'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 'var(--type-overline-font-size)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'capitalize', letterSpacing: 0.6, borderBottom: '1px solid #f3f4f6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r._id ?? i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderLeft: !r.passed ? '3px solid #ef4444' : '3px solid transparent' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--type-body2-font-size)', color: 'var(--text-primary)' }}>{r.payloadName}</div>
                    <div style={{ fontSize: 'var(--type-overline-font-size)', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{String(r.payloadId || i).slice(-8)}</div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ background: '#f3f4f6', borderRadius: 6, padding: '3px 8px', fontSize: 'var(--type-overline-font-size)', fontFamily: "'JetBrains Mono',monospace", color: 'var(--text-primary)' }}>{r.edgeCaseType || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: r.passed ? '#dcfce7' : '#fee2e2', color: r.passed ? '#16a34a' : '#dc2626', fontSize: 'var(--type-caption-font-size)', fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.passed ? '#22c55e' : '#ef4444' }} />
                      {r.statusCode} {r.statusText}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px' }}><LatencyBadge ms={r.latencyMs} /></td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--type-caption-font-size)', color: r.passed ? '#16a34a' : '#dc2626' }}>{r.passed ? '✓ PASS' : '✕ FAIL'}</span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <button onClick={() => downloadRowAsJson(r, report.configName)} title="Download as JSON"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: 'var(--text-secondary)', fontSize: 'var(--type-overline-font-size)', fontWeight: 500, cursor: 'pointer' }}>
                      <FileDown size={12} /> JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────── */
export default function ExecutionResults() {
  const PAGE_SIZE = 10;
  const [reports,   setReports]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [drawer,    setDrawer]    = useState(null);
  const [deleting,  setDeleting]  = useState(null);
  const [bugConfig, setBugConfig] = useState(null);
  const [selected,  setSelected]  = useState(new Set());
  const [showBug,   setShowBug]   = useState(false);
  const [page,      setPage]      = useState(1);

  useEffect(() => {
    fetchReports()
      .then(setReports)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    getBugConfig()
      .then(setBugConfig)
      .catch(() => setBugConfig({ github: false, jira: false }));
  }, []);

  const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
  const pageStartIndex = (page - 1) * PAGE_SIZE;
  const pagedReports = reports.slice(pageStartIndex, pageStartIndex + PAGE_SIZE);
  const pageEndIndex = Math.min(pageStartIndex + PAGE_SIZE, reports.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleRow = (id) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allSelected = pagedReports.length > 0 && pagedReports.every(r => selected.has(r._id));
  const toggleAll = () =>
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) {
        pagedReports.forEach(r => next.delete(r._id));
      } else {
        pagedReports.forEach(r => next.add(r._id));
      }
      return next;
    });

  const selectedReports = reports.filter(r => selected.has(r._id));

  const deleteReportById = async (id) => {
    setDeleting(id);
    try {
      await deleteReport(id);
      setReports(prev => prev.filter(r => r._id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      toast.success('Report deleted');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDelete = (e, id, reportName) => {
    e.stopPropagation();
    toast.custom(
      (t) => (
        <div style={DELETE_CONFIRM_TOAST.box}>
          <div style={DELETE_CONFIRM_TOAST.title}>Delete report?</div>
          <div style={DELETE_CONFIRM_TOAST.text}>
            {`"${reportName}" will be deleted permanently.`}
          </div>
          <div style={DELETE_CONFIRM_TOAST.actions}>
            <button
              style={{ ...DELETE_CONFIRM_TOAST.btn, ...DELETE_CONFIRM_TOAST.cancelBtn }}
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
            <button
              style={{ ...DELETE_CONFIRM_TOAST.btn, ...DELETE_CONFIRM_TOAST.deleteBtn }}
              onClick={() => {
                toast.dismiss(t.id);
                void deleteReportById(id);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { id: `delete-report-${id}`, duration: 9000, position: 'top-center' }
    );
  };

  const totalExecutions = reports.reduce((s, r) => s + (r.executed ?? 0), 0);
  const totalFailed     = reports.reduce((s, r) => s + (r.failed   ?? 0), 0);
  const totalPassed     = reports.reduce((s, r) => s + (r.passed   ?? 0), 0);
  const allLatencies    = reports.flatMap(r => (r.results || []).map(x => x.latencyMs)).filter(Boolean);
  const avgLatency      = allLatencies.length ? Math.round(allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length) : null;
  const passRate        = totalExecutions ? ((totalPassed / totalExecutions) * 100).toFixed(1) : '—';

  const handleBulkPDF = () => {
    if (!selectedReports.length) return;
    selectedReports.forEach((rep, i) => setTimeout(() => downloadReportPDF(rep), i * 600));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', fontFamily: 'var(--font-sans)', padding: '32px 40px' }}>

      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--type-h5-font-size)',
            fontWeight: 500,
            lineHeight: 'var(--type-h5-line-height)',
            letterSpacing: 'var(--type-h5-letter-spacing)',
            color: 'var(--text-primary)',
          }}
        >
          Execution Results
        </h1>
        <p
          style={{
            marginTop: 4,
            fontSize: 'var(--type-body1-font-size)',
            fontWeight: 'var(--type-body1-font-weight)',
            lineHeight: 'var(--type-body1-line-height)',
            letterSpacing: 'var(--type-body1-letter-spacing)',
            color: 'var(--text-secondary)',
          }}
        >
          All API test runs. Click a row to inspect individual payload results.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Executions" value={totalExecutions.toLocaleString()} />
        <StatCard label="Failures" value={totalFailed} sub={totalFailed > 0 ? 'Needs Attention' : 'All Passing'} subColor={totalFailed > 0 ? '#dc2626' : '#16a34a'} valueColor={totalFailed > 0 ? '#dc2626' : '#111827'} />
        <StatCard label="Avg Latency" value={avgLatency ? `${avgLatency}ms` : '—'} sub="Across All Runs" />
        <StatCard label="Pass Rate" value={`${passRate}%`} sub={`${totalPassed} Passed`} subColor="#16a34a" />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d9dee8', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #e9edf4' }}>
          <div
            style={{
              fontSize: 'var(--type-subtitle1-font-size)',
              fontWeight: 600,
              lineHeight: 'var(--type-subtitle1-line-height)',
              letterSpacing: 'var(--type-subtitle1-letter-spacing)',
              color: 'var(--text-primary)',
            }}
          >
            Run History
            {!loading && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 'var(--type-body2-font-size)',
                  fontWeight: 'var(--type-body2-font-weight)',
                  lineHeight: 'var(--type-body2-line-height)',
                  letterSpacing: 'var(--type-body2-letter-spacing)',
                  color: 'var(--text-muted)',
                }}
              >
                ({reports.length} runs)
              </span>
            )}
          </div>
          {selected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 'var(--type-caption-font-size)', color: 'var(--text-secondary)', marginRight: 4 }}>{selected.size} selected</span>
              <button onClick={handleBulkPDF}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: 'var(--text-primary)', fontSize: 'var(--type-caption-font-size)', fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <Download size={13} /> Download PDF{selected.size > 1 ? 's' : ''}
              </button>
              {/* <button onClick={() => setShowBug(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff', color: '#ef4444', fontSize: 'var(--type-caption-font-size)', fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff1f1'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <Bug size={13} /> Report Bug
              </button> */}
              <button onClick={() => setSelected(new Set())}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: 'var(--text-muted)', fontSize: 'var(--type-caption-font-size)', cursor: 'pointer' }}>
                Clear
              </button>
            </div>
          )}
        </div>

        {loading && <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--type-subtitle2-font-size)' }}>Loading reports…</div>}
        {error   && <div style={{ padding: 48, textAlign: 'center', color: '#dc2626', fontSize: 'var(--type-subtitle2-font-size)' }}>{error}</div>}
        {!loading && !error && reports.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--type-subtitle2-font-size)' }}>No reports yet. Run an API test first.</div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1120, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#f8f9fc' }}>
                <th style={{ padding: '10px 16px', borderBottom: '1px solid #e9edf4', width: 44 }}>
                  <button onClick={toggleAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: allSelected ? '#7c3aed' : '#d1d5db', display: 'flex', alignItems: 'center' }}>
                    {allSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                  </button>
                </th>
                {[
                  { label: 'Config Name', width: '17%' },
                  { label: 'Method / URL', width: '40%' },
                  { label: 'Payloads', width: 95 },
                  { label: 'Passed', width: 95 },
                  { label: 'Failed', width: 95 },
                  { label: 'Avg Latency', width: 120 },
                  { label: 'Run At', width: 160 },
                  { label: '', width: 140 },
                ].map(({ label, width }) => (
                  <th
                    key={label || 'actions'}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: 'var(--type-subtitle2-font-size)',
                      fontWeight: 'var(--type-subtitle2-font-weight)',
                      lineHeight: 'var(--type-subtitle2-line-height)',
                      letterSpacing: 'var(--type-subtitle2-letter-spacing)',
                      color: 'var(--text-primary)',
                      borderBottom: '1px solid #e9edf4',
                      width,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedReports.map((report, idx) => {
                const avg        = rowAvgLatency(report);
                const isSelected = selected.has(report._id);
                return (
                  <tr key={report._id}
                    style={{
                      background: isSelected ? '#faf5ff' : '#fff',
                      borderBottom: '1px solid #eef1f6',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8f9fc'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#fff'; }}
                    onClick={() => setDrawer(report)}
                  >
                    <td style={{ padding: '14px 16px' }} onClick={e => { e.stopPropagation(); toggleRow(report._id); }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSelected ? '#7c3aed' : '#d1d5db', display: 'flex', alignItems: 'center' }}>
                        {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--type-subtitle2-font-size)', color: 'var(--text-primary)' }}>{report.configName}</div>
                      <div style={{ fontSize: 'var(--type-overline-font-size)', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{String(report._id).slice(-8)}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 'var(--type-overline-font-size)', fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '2px 7px', borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", marginRight: 6 }}>{report.method}</span>
                      <span style={{ fontSize: 'var(--type-caption-font-size)', color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono',monospace", display: 'inline-block', maxWidth: 'calc(100% - 72px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{report.url}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 'var(--type-subtitle2-font-size)', color: 'var(--text-primary)', fontWeight: 500 }}>{report.totalPayloads}</td>
                    <td style={{ padding: '14px 16px' }}><span style={{ color: '#16a34a', fontWeight: 700, fontSize: 'var(--type-subtitle2-font-size)' }}>{report.passed}</span></td>
                    <td style={{ padding: '14px 16px' }}><span style={{ color: report.failed > 0 ? '#dc2626' : '#16a34a', fontWeight: 700, fontSize: 'var(--type-subtitle2-font-size)' }}>{report.failed}</span></td>
                    <td style={{ padding: '14px 16px' }}>{avg !== null ? <LatencyBadge ms={avg} /> : '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 'var(--type-caption-font-size)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{new Date(report.runAt).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, flexWrap: 'nowrap' }}>
                        <button onClick={() => downloadReportPDF(report)} title="Download report as PDF"
                          style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                          <Download size={13} />
                        </button>
                        {/* {report.failed > 0 && (
                          <button onClick={() => { setSelected(new Set([report._id])); setShowBug(true); }} title="Report bug for failed cases"
                            style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fff1f1'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                            <Bug size={13} />
                          </button>
                        )} */}
                        <button onClick={e => handleDelete(e, report._id, report.configName)} disabled={deleting === report._id} title="Delete report"
                          style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleting === report._id ? 0.5 : 1 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fff1f1'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                          {deleting === report._id ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
        {!loading && !error && reports.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              padding: '10px 16px',
              borderTop: '1px solid #e9edf4',
              background: '#fff',
            }}
          >
            <span
              style={{
                fontSize: 'var(--type-caption-font-size)',
                color: 'var(--text-secondary)',
              }}
            >
              {`${pageStartIndex + 1}-${pageEndIndex} of ${reports.length}`}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: p === page ? '1px solid #3b82f6' : '1px solid transparent',
                  background: p === page ? '#eff6ff' : '#f3f4f6',
                  color: p === page ? '#2563eb' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 'var(--type-caption-font-size)',
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {drawer  && <ResultsDrawer report={drawer} onClose={() => setDrawer(null)} />}
      {showBug && <BugModal reports={selectedReports} bugConfig={bugConfig} onClose={() => setShowBug(false)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


