import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, X, Play, Zap, Save, ArrowLeft, BarChart2 } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { configsApi, payloadsApi, runnerApi, aiApi } from '../services/api';
import { Button, Select, StatusBadge, Spinner, EmptyState } from '../components/ui';
import styles from './ConfigEditorPage.module.css';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const cmTheme = { '&': { fontFamily: 'var(--font-mono)', fontSize: '12px' } };
const cmExtensions = [json()];

function safeJson(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return JSON.stringify(val, null, 2);
}

function parseJson(str) {
  if (!str || !str.trim()) return {};
  try { return JSON.parse(str); }
  catch { return null; }
}

export default function ConfigEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [config, setConfig]               = useState(null);
  const [payloads, setPayloads]           = useState([]);
  const [selectedPayload, setSelected]    = useState(null);
  const [loading, setLoading]             = useState(true);
  const [running, setRunning]             = useState(false);
  const [runningAll, setRunningAll]       = useState(false);
  const [savingConfig, setSavingConfig]   = useState(false);
  const [generatingAI, setGeneratingAI]  = useState(false);

  // Config form state
  const [method, setMethod]         = useState('POST');
  const [url, setUrl]               = useState('');
  const [headersStr, setHeadersStr] = useState('{}');
  const [queryStr, setQueryStr]     = useState('{}');

  // Payload editor state
  const [payloadName, setPayloadName]   = useState('');
  const [payloadBody, setPayloadBody]   = useState('{}');

  // AI generator state
  const [dtoStr, setDtoStr]   = useState('');
  const [aiCount, setAiCount] = useState(10);

  // Response panel
  const [lastResponse, setLastResponse] = useState(null);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [cfg, plds] = await Promise.all([
        configsApi.getOne(id),
        payloadsApi.getByConfig(id),
      ]);
      setConfig(cfg);
      setMethod(cfg.method);
      setUrl(cfg.url);
      setHeadersStr(safeJson(cfg.headers) || '{}');
      setQueryStr(safeJson(cfg.queryParams) || '{}');
      setPayloads(plds);
      if (plds.length) selectPayload(plds[0]);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectPayload = (p) => {
    setSelected(p);
    setPayloadName(p.name);
    setPayloadBody(safeJson(p.body) || '{}');
    if (p.lastResult?.response) {
      setLastResponse(p.lastResult);
    } else {
      setLastResponse(null);
    }
  };

  const handleSaveConfig = async () => {
    const headers   = parseJson(headersStr);
    const queryParams = parseJson(queryStr);
    if (headers === null)      return toast.error('Headers: invalid JSON');
    if (queryParams === null)  return toast.error('Query Params: invalid JSON');
    if (!url.trim())           return toast.error('URL is required');

    setSavingConfig(true);
    try {
      const updated = await configsApi.update(id, { method, url, headers, queryParams });
      setConfig(updated);
      toast.success('Config saved');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddPayload = async () => {
    try {
      const p = await payloadsApi.create({ configId: id, name: `Payload ${payloads.length + 1}`, body: {} });
      const updated = [...payloads, p];
      setPayloads(updated);
      selectPayload(p);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleSavePayload = async () => {
    if (!selectedPayload) return;
    const body = parseJson(payloadBody);
    if (body === null) return toast.error('Payload body: invalid JSON');

    try {
      const updated = await payloadsApi.update(selectedPayload._id, { name: payloadName, body });
      setPayloads((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      setSelected(updated);
      toast.success('Payload saved');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDeletePayload = async (pid) => {
    try {
      await payloadsApi.remove(pid);
      const updated = payloads.filter((p) => p._id !== pid);
      setPayloads(updated);
      if (selectedPayload?._id === pid) {
        if (updated.length) selectPayload(updated[0]);
        else { setSelected(null); setPayloadName(''); setPayloadBody('{}'); setLastResponse(null); }
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleRunOne = async () => {
    if (!selectedPayload) return toast.error('Select a payload first');
    // Auto-save payload first
    const body = parseJson(payloadBody);
    if (body === null) return toast.error('Fix JSON before running');
    await payloadsApi.update(selectedPayload._id, { name: payloadName, body }).catch(() => {});

    setRunning(true);
    try {
      const result = await runnerApi.runOne(id, selectedPayload._id);
      setLastResponse(result);
      const updatedPayload = { ...selectedPayload, lastResult: { ...result, runAt: new Date() } };
      setSelected(updatedPayload);
      setPayloads((prev) => prev.map((p) => (p._id === updatedPayload._id ? updatedPayload : p)));
      toast.success(`${result.statusCode} · ${result.latencyMs}ms`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  const handleRunAll = async () => {
    if (!payloads.length) return toast.error('No payloads to run');
    setRunningAll(true);
    try {
      const { report, summary } = await runnerApi.runAll(id, 300);
      toast.success(`Done! ${summary.passed}/${summary.total} passed`);
      // Refresh payloads to get updated lastResults
      const plds = await payloadsApi.getByConfig(id);
      setPayloads(plds);
      if (selectedPayload) {
        const refreshed = plds.find((p) => p._id === selectedPayload._id);
        if (refreshed) selectPayload(refreshed);
      }
      navigate(`/report/${report._id}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRunningAll(false);
    }
  };

  const handleGenerateAI = async () => {
    const dto = parseJson(dtoStr);
    if (!dtoStr.trim()) return toast.error('Enter a payload DTO first');
    if (dto === null)   return toast.error('DTO: invalid JSON');

    setGeneratingAI(true);
    try {
      const res = await aiApi.generateEdgeCases({ configId: id, dto, method, url, count: aiCount });
      const plds = await payloadsApi.getByConfig(id);
      setPayloads(plds);
      toast.success(`Generated ${res.count} edge cases`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGeneratingAI(false);
    }
  };

  if (loading) return <div className={styles.center}><Spinner size={28} /></div>;
  if (!config)  return <div className={styles.center}><p>Config not found.</p></div>;

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')}><ArrowLeft size={16} /></button>
          <div className={styles.configInfo}>
            <div className={styles.configTitle}>{config.name}</div>
            <div className={styles.configMeta}>
              {config.method} · {config.url}
              {config.lastRun && ` · Last run: ${new Date(config.lastRun).toLocaleString()}`}
            </div>
          </div>
        </div>
        <div className={styles.topbarRight}>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>Back</Button>
          <Button variant="outline" size="sm" onClick={handleSaveConfig} loading={savingConfig}>
            <Save size={13} /> Save
          </Button>
          <Button size="sm" onClick={handleRunAll} loading={runningAll}>
            <BarChart2 size={13} /> Generate report
          </Button>
        </div>
      </div>

      {/* 3-panel body */}
      <div className={styles.panels}>

        {/* LEFT: Payloads list */}
        <aside className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Payloads</span>
            <button className={styles.addBtn} onClick={handleAddPayload} title="Add payload">
              <Plus size={13} /> Add
            </button>
          </div>

          <div className={styles.payloadList}>
            {payloads.length === 0 && (
              <p className={styles.emptyMsg}>No payloads yet. Click + Add.</p>
            )}
            {payloads.map((p) => (
              <div
                key={p._id}
                className={`${styles.payloadItem} ${selectedPayload?._id === p._id ? styles.payloadSelected : ''}`}
                onClick={() => selectPayload(p)}
              >
                <div className={styles.payloadItemTop}>
                  <span className={styles.payloadItemName}>{p.name}</span>
                  <div className={styles.payloadItemActions}>
                    {p.lastResult && <StatusBadge passed={p.lastResult.passed} />}
                    <button
                      className={styles.removeBtn}
                      onClick={(e) => { e.stopPropagation(); handleDeletePayload(p._id); }}
                    ><X size={12} /></button>
                  </div>
                </div>
                {p.lastResult && (
                  <div className={styles.payloadItemMeta}>
                    HTTP {p.lastResult.statusCode} · {p.lastResult.latencyMs}ms
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Payload editor */}
          {selectedPayload && (
            <div className={styles.payloadEditor}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Payload name</label>
                <input
                  className={styles.textInput}
                  value={payloadName}
                  onChange={(e) => setPayloadName(e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>JSON body / params</label>
                <CodeMirror
                  value={payloadBody}
                  height="120px"
                  extensions={cmExtensions}
                  theme="light"
                  style={cmTheme}
                  onChange={setPayloadBody}
                  className={styles.codeEditor}
                />
              </div>
              <div className={styles.payloadBtns}>
                <Button size="sm" onClick={handleRunOne} loading={running}>
                  <Play size={12} /> Run payload
                </Button>
                <Button variant="outline" size="sm" onClick={handleRunAll} loading={runningAll}>
                  Run all with delay
                </Button>
              </div>
            </div>
          )}
        </aside>

        {/* CENTER: API Config */}
        <div className={styles.centerPanel}>
          <div className={styles.panelSection}>
            <div className={styles.panelTitle}>API Config</div>
            <p className={styles.panelSubtitle}>Configure method, URL, and headers.</p>

            <div className={styles.urlRow}>
              <div className={styles.fieldGroup} style={{ width: 110 }}>
                <label className={styles.fieldLabel}>Method</label>
                <select className={styles.selectInput} value={method} onChange={(e) => setMethod(e.target.value)}>
                  {METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className={styles.fieldGroup} style={{ flex: 1 }}>
                <label className={styles.fieldLabel}>URL</label>
                <input
                  className={styles.textInput}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Headers (JSON)</label>
              <CodeMirror
                value={headersStr}
                height="100px"
                extensions={cmExtensions}
                theme="light"
                style={cmTheme}
                onChange={setHeadersStr}
                className={styles.codeEditor}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Query (JSON)</label>
              <CodeMirror
                value={queryStr}
                height="80px"
                extensions={cmExtensions}
                theme="light"
                style={cmTheme}
                onChange={setQueryStr}
                className={styles.codeEditor}
              />
            </div>
          </div>

          {/* AI Generator section */}
          <div className={styles.panelSection} style={{ marginTop: 24 }}>
            <div className={styles.panelTitle}>Example Generator</div>
            <p className={styles.panelSubtitle}>
              Provide a payload DTO (JSON object). AI will generate test variants; each becomes a separate payload. Then use "Run all with delay" to test.
            </p>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Payload DTO (JSON)</label>
              <CodeMirror
                value={dtoStr}
                height="100px"
                extensions={cmExtensions}
                theme="light"
                style={cmTheme}
                onChange={setDtoStr}
                placeholder='{ "title": "hello", "userId": 1 }'
                className={styles.codeEditor}
              />
            </div>
            <div className={styles.aiRow}>
              <div style={{ paddingTop: 18 }}>
                <Button variant="outline" size="sm" onClick={handleGenerateAI} loading={generatingAI}>
                  <Zap size={13} /> Generate Examples
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Response */}
        <aside className={styles.rightPanel}>
          <div className={styles.panelTitle}>Response</div>
          {!lastResponse ? (
            <EmptyState title="No response yet" description="Run a payload to see the response here." />
          ) : (
            <div className={styles.responseContent}>
              <div className={styles.responseHeader}>
                <span className={styles.payloadItemName}>{selectedPayload?.name}</span>
                <span className={styles.responseMeta}>
                  HTTP {lastResponse.statusCode} {lastResponse.statusText} · {lastResponse.latencyMs}ms
                </span>
              </div>
              <CodeMirror
                value={safeJson(lastResponse.response || lastResponse.error || '')}
                height="calc(100vh - 220px)"
                extensions={cmExtensions}
                theme="light"
                style={cmTheme}
                editable={false}
                className={styles.codeEditor}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
