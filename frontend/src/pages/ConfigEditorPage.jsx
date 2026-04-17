import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, X, Play, Zap, Save, BarChart2 } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { configsApi, payloadsApi, runnerApi, aiApi } from '../services/api';
import { PreviousPageArrow } from '../theme/components/PreviousPageArrow';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const cmExtensions = [json()];
const EDITOR_DRAFT_KEY_PREFIX = 'api-flow-tester:config-editor:';

function getEditorDraftKey(configId) {
  return `${EDITOR_DRAFT_KEY_PREFIX}${configId}`;
}

function readEditorDraft(configId) {
  if (!configId || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getEditorDraftKey(configId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeEditorDraft(configId, draft) {
  if (!configId || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getEditorDraftKey(configId), JSON.stringify(draft));
  } catch {
    // Ignore storage quota/unavailability issues.
  }
}

function safeJson(val) {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string') return val;
  return JSON.stringify(val, null, 2);
}

function parseJson(str) {
  if (!str || !str.trim()) return {};
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function normalizeOptionalJsonSchema(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    return Object.keys(value).length > 0 ? value : null;
  }
  return value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function CodeEditor({ value, onChange, height = '120px', editable = true, placeholder }) {
  const theme = useTheme();
  const editorBorder = theme.overview?.borderBox || theme.palette.divider;

  return (
    <Box
      sx={{
        border: `1px solid ${editorBorder}`,
        borderRadius: 1.5,
        overflow: 'hidden',
        '& .cm-editor': {
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 'var(--type-caption-font-size)',
          backgroundColor: theme.palette.background.default,
        },
        '& .cm-focused': { outline: 'none' },
      }}
    >
      <CodeMirror
        value={value}
        height={height}
        extensions={cmExtensions}
        theme="light"
        editable={editable}
        placeholder={placeholder}
        onChange={onChange}
      />
    </Box>
  );
}

export default function ConfigEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const borderColor = theme.overview?.borderBox || theme.palette.divider;
  const passBg = theme.chip?.approvalStatus?.approved || theme.palette.success.main;
  const failBg = theme.chip?.approvalStatus?.rejected || theme.palette.error.main;

  const [config, setConfig] = useState(null);
  const [payloads, setPayloads] = useState([]);
  const [selectedPayload, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runningAll, setRunningAll] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  const [method, setMethod] = useState('POST');
  const [url, setUrl] = useState('');
  const [headersStr, setHeadersStr] = useState('{}');
  const [queryStr, setQueryStr] = useState('{}');
  const [sampleResponseStr, setSampleResponseStr] = useState('{}');

  const [payloadName, setPayloadName] = useState('');
  const [payloadBody, setPayloadBody] = useState('{}');

  const [dtoStr, setDtoStr] = useState('');

  const [lastResponse, setLastResponse] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [id]);

  useEffect(() => {
    if (loading || !config) return;

    writeEditorDraft(id, {
      method,
      url,
      headersStr,
      queryStr,
      sampleResponseStr,
      dtoStr,
      selectedPayloadId: selectedPayload?._id || null,
      editingPayloadId: selectedPayload?._id || null,
      payloadNameDraft: payloadName,
      payloadBodyDraft: payloadBody,
      lastResponse,
    });
  }, [
    id,
    loading,
    config,
    method,
    url,
    headersStr,
    queryStr,
    sampleResponseStr,
    dtoStr,
    selectedPayload?._id,
    payloadName,
    payloadBody,
    lastResponse,
  ]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [cfg, plds] = await Promise.all([
        configsApi.getOne(id),
        payloadsApi.getByConfig(id),
      ]);
      const draft = readEditorDraft(id);

      setConfig(cfg);
      setMethod(typeof draft?.method === 'string' ? draft.method : cfg.method);
      setUrl(typeof draft?.url === 'string' ? draft.url : cfg.url);
      setHeadersStr(typeof draft?.headersStr === 'string' ? draft.headersStr : safeJson(cfg.headers) || '{}');
      setQueryStr(typeof draft?.queryStr === 'string' ? draft.queryStr : safeJson(cfg.queryParams) || '{}');
      setSampleResponseStr(
        typeof draft?.sampleResponseStr === 'string'
          ? draft.sampleResponseStr
          : safeJson(cfg.sampleResponseDto) || '{}'
      );
      setDtoStr(typeof draft?.dtoStr === 'string' ? draft.dtoStr : '');
      setPayloads(plds);

      if (plds.length) {
        const restoredPayload = draft?.selectedPayloadId
          ? plds.find((p) => p._id === draft.selectedPayloadId)
          : null;
        selectPayload(restoredPayload || plds[0], { preserveDraft: true, draft });
      } else {
        setSelected(null);
        setPayloadName('');
        setPayloadBody('{}');
        setLastResponse(null);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectPayload = (p, options = {}) => {
    const hasDraftForPayload =
      options.preserveDraft &&
      options.draft &&
      options.draft.editingPayloadId === p._id;

    setSelected(p);
    setPayloadName(
      hasDraftForPayload && typeof options.draft.payloadNameDraft === 'string'
        ? options.draft.payloadNameDraft
        : p.name
    );
    setPayloadBody(
      hasDraftForPayload && typeof options.draft.payloadBodyDraft === 'string'
        ? options.draft.payloadBodyDraft
        : safeJson(p.body) || '{}'
    );

    if (p.lastResult) {
      setLastResponse(p.lastResult);
    } else if (hasDraftForPayload && options.draft.lastResponse) {
      setLastResponse(options.draft.lastResponse);
    } else {
      setLastResponse(null);
    }
  };

  const handleSaveConfig = async () => {
    const headers = parseJson(headersStr);
    const queryParams = parseJson(queryStr);
    const sampleResponseDto = parseJson(sampleResponseStr);
    const normalizedSampleResponseDto = normalizeOptionalJsonSchema(sampleResponseDto);
    if (headers === null) return toast.error('Headers: invalid JSON');
    if (queryParams === null) return toast.error('Query Params: invalid JSON');
    if (sampleResponseDto === null) return toast.error('Sample Response: invalid JSON');
    if (!url.trim()) return toast.error('URL is required');

    setSavingConfig(true);
    try {
      const updated = await configsApi.update(id, { 
        method, 
        url, 
        headers, 
        queryParams,
        sampleResponseDto: normalizedSampleResponseDto,
      });
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
      const p = await payloadsApi.create({
        configId: id,
        name: `Payload ${payloads.length + 1}`,
        body: {},
      });
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
        else {
          setSelected(null);
          setPayloadName('');
          setPayloadBody('{}');
          setLastResponse(null);
        }
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleRunOne = async () => {
    if (!selectedPayload) return toast.error('Select a payload first');
    const body = parseJson(payloadBody);
    const sampleResponseDto = parseJson(sampleResponseStr);
    const normalizedSampleResponseDto = normalizeOptionalJsonSchema(sampleResponseDto);
    if (body === null) return toast.error('Fix JSON before running');
    if (sampleResponseDto === null) return toast.error('Sample Response: invalid JSON');
    await payloadsApi.update(selectedPayload._id, { name: payloadName, body }).catch(() => {});

    setRunning(true);
    try {
      const result = await runnerApi.runOne(id, selectedPayload._id, normalizedSampleResponseDto);
      setLastResponse(result);
      const updatedPayload = { ...selectedPayload, lastResult: { ...result, runAt: new Date() } };
      setSelected(updatedPayload);
      setPayloads((prev) => prev.map((p) => (p._id === updatedPayload._id ? updatedPayload : p)));
      if (result.passed) {
        toast.success(`${result.statusCode} · ${result.latencyMs}ms`);
      } else {
        toast.error(`Failed · HTTP ${result.statusCode} · ${result.latencyMs}ms`);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!payloads.length) return toast.error('No payloads to run');
    const sampleResponseDto = parseJson(sampleResponseStr);
    const normalizedSampleResponseDto = normalizeOptionalJsonSchema(sampleResponseDto);
    if (sampleResponseDto === null) return toast.error('Sample Response: invalid JSON');
    setRunningAll(true);
    try {
      const { report, summary } = await runnerApi.runAll(id, 300, normalizedSampleResponseDto);
      toast.success(`Done! ${summary.passed}/${summary.total} passed`);
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

  const handleRunAllWithDelay = async () => {
    if (!payloads.length) return toast.error('No payloads to run');
    const sampleResponseDto = parseJson(sampleResponseStr);
    const normalizedSampleResponseDto = normalizeOptionalJsonSchema(sampleResponseDto);
    if (sampleResponseDto === null) return toast.error('Sample Response: invalid JSON');

    setRunningAll(true);
    try {
      let passed = 0;
      const runDelayMs = 300;

      for (let i = 0; i < payloads.length; i += 1) {
        const payload = payloads[i];
        const result = await runnerApi.runOne(id, payload._id, normalizedSampleResponseDto);
        if (result.passed) passed += 1;

        const updatedPayload = { ...payload, lastResult: { ...result, runAt: new Date() } };
        setPayloads((prev) => prev.map((p) => (p._id === updatedPayload._id ? updatedPayload : p)));
        setSelected(updatedPayload);
        setPayloadName(updatedPayload.name);
        setPayloadBody(safeJson(updatedPayload.body) || '{}');
        setLastResponse(result);

        if (i < payloads.length - 1) await sleep(runDelayMs);
      }

      toast.success(`Run complete: ${passed}/${payloads.length} passed`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRunningAll(false);
    }
  };

  const handleGenerateAI = async () => {
    const dto = parseJson(dtoStr);
    if (!dtoStr.trim()) return toast.error('Enter a payload DTO first');
    if (dto === null) return toast.error('DTO: invalid JSON');

    setGeneratingAI(true);
    try {
      const res = await aiApi.generateEdgeCases({ configId: id, dto, method, url, count: 'max' });
      const plds = await payloadsApi.getByConfig(id);
      setPayloads(plds);
      if (plds.length) {
        const currentId = selectedPayload?._id;
        const toSelect = currentId ? plds.find((p) => p._id === currentId) || plds[0] : plds[0];
        selectPayload(toSelect);
      } else {
        setSelected(null);
        setPayloadName('');
        setPayloadBody('{}');
      }
      toast.success(`Generated ${res.count} edge cases`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGeneratingAI(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!config) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body1">Config not found.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: theme.palette.background.default,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: '7.5px 20px',
          borderBottom: `1px solid ${borderColor}`,
          bgcolor: theme.palette.background.paper,
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.6, minWidth: 0, flex: 1 }}>
          <IconButton
            size="small"
            onClick={() => navigate('/')}
            sx={{
              border: 'none',
              borderRadius: 0,
              bgcolor: 'transparent',
              '&:hover': { bgcolor: 'transparent' },
            }}
          >
            <PreviousPageArrow width={24} height={24} />
          </IconButton>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap>
              {config.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {config.method} · {config.url}
              {config.lastRun ? ` · Last run: ${new Date(config.lastRun).toLocaleString()}` : ''}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" color="primary" onClick={() => navigate('/')}>
            Back
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleSaveConfig}
            disabled={savingConfig}
            startIcon={savingConfig ? <CircularProgress size={14} /> : <Save size={13} />}
          >
            Save
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateReport}
            disabled={runningAll}
            startIcon={runningAll ? <CircularProgress size={14} color="inherit" /> : <BarChart2 size={13} />}
          >
            Generate report
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '300px 1fr', lg: '325px 1fr 450px' },
        }}
      >
        <Box
          sx={{
            borderRight: `1px solid ${borderColor}`,
            bgcolor: theme.palette.background.paper,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: '12px 14px 10px',
              borderBottom: `1px solid ${borderColor}`,
            }}
          >
            <Typography variant="subtitle2">
              Payloads
            </Typography>
            <Button variant="text" color="primary" startIcon={<Plus size={13} />} onClick={handleAddPayload}>
              Add
            </Button>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            {payloads.length === 0 && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                No payloads yet. Click Add.
              </Typography>
            )}
            {payloads.map((p) => (
              <Box
                key={p._id}
                onClick={() => selectPayload(p)}
                sx={{
                  p: 1.2,
                  borderRadius: 1.5,
                  mb: 0.5,
                  cursor: 'pointer',
                  border: `1px solid ${
                    selectedPayload?._id === p._id ? theme.palette.primary.main : 'transparent'
                  }`,
                  bgcolor: selectedPayload?._id === p._id ? theme.palette.action.selected : 'transparent',
                  '&:hover': { bgcolor: theme.palette.action.hover },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography variant="subtitle2" noWrap>
                    {p.name}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {p.lastResult && (
                      <Chip
                        size="small"
                        label={p.lastResult.passed ? 'PASS' : 'FAIL'}
                        sx={{
                          height: 20,
                          fontSize: 'var(--type-overline-font-size)',
                          fontWeight: 600,
                          color: '#fff',
                          bgcolor: p.lastResult.passed ? passBg : failBg,
                        }}
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePayload(p._id);
                      }}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: theme.palette.error.main,
                          bgcolor: '#FDECEA',
                        },
                      }}
                    >
                      <X size={12} />
                    </IconButton>
                  </Stack>
                </Box>
                {p.lastResult && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    HTTP {p.lastResult.statusCode} · {p.lastResult.latencyMs}ms
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          {selectedPayload && (
            <Box
              sx={{
                borderTop: `1px solid ${borderColor}`,
                p: 1.5,
                pb: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Payload name
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={payloadName}
                  onChange={(e) => setPayloadName(e.target.value)}
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  JSON body / params
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <CodeEditor value={payloadBody} onChange={setPayloadBody} height="120px" />
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRunOne}
                  disabled={running}
                  startIcon={running ? <CircularProgress size={14} color="inherit" /> : <Play size={12} />}
                >
                  Run payload
                </Button>
                <Button variant="outlined" color="primary" onClick={handleRunAllWithDelay} disabled={runningAll}>
                  Run all with delay
                </Button>
              </Box>
              <Button variant="outlined" color="primary" onClick={handleSavePayload}>
                Save payload
              </Button>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            overflowY: 'auto',
            p: { xs: 1.5, md: 2.5 },
            bgcolor: theme.palette.background.default,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${borderColor}`,
              borderRadius: 2,
              p: { xs: 1.5, md: 2.5 },
            }}
          >
            <Typography variant="subtitle2">
              API Config
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Configure method, URL, and headers.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-end', mb: 1.75 }}>
              <Box sx={{ width: 120 }}>
                <Typography variant="caption" color="text.secondary">
                  Method
                </Typography>
                <TextField
                  size="small"
                  select
                  fullWidth
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  sx={{ mt: 0.5 }}
                >
                  {METHODS.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  URL
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Headers (JSON)
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <CodeEditor value={headersStr} onChange={setHeadersStr} height="100px" />
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Query (JSON)
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <CodeEditor value={queryStr} onChange={setQueryStr} height="80px" />
              </Box>
            </Box>

            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Sample Response DTO (JSON)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, mb: 0.75 }}>
                Responses will be validated against this schema. Leave empty to skip validation.
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <CodeEditor 
                  value={sampleResponseStr} 
                  onChange={setSampleResponseStr} 
                  height="100px"
                  placeholder='{ "id": 1, "name": "string", "data": {} }'
                />
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              mt: 3,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${borderColor}`,
              borderRadius: 2,
              p: { xs: 1.5, md: 2.5 },
            }}
          >
            <Typography variant="subtitle2">
              Example Generator
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, mb: 1.5 }}>
              Provide a payload DTO JSON. AI generates test variants as separate payloads.
            </Typography>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Payload DTO (JSON)
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <CodeEditor
                  value={dtoStr}
                  onChange={setDtoStr}
                  height="100px"
                  placeholder='{ "title": "hello", "userId": 1 }'
                />
              </Box>
            </Box>
            <Box sx={{ mt: 1.5 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleGenerateAI}
                disabled={generatingAI}
                startIcon={generatingAI ? <CircularProgress size={14} /> : <Zap size={13} />}
              >
                Generate examples
              </Button>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            borderLeft: `1px solid ${borderColor}`,
            bgcolor: theme.palette.background.paper,
            p: 1.75,
            display: { xs: 'none', lg: 'flex' },
            flexDirection: 'column',
            gap: 1.25,
            minHeight: 0,
          }}
        >
          <Typography variant="subtitle2">
            Response
          </Typography>
          {!lastResponse ? (
            <Box
              sx={{
                border: `1px dashed ${borderColor}`,
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <Typography variant="subtitle2" color="text.primary">
                No response yet
              </Typography>
              <Typography variant="body2">Run a payload to see the response here.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minHeight: 0 }}>
              <Box>
                <Typography variant="subtitle2" noWrap>
                  {selectedPayload?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  HTTP {lastResponse.statusCode} {lastResponse.statusText} · {lastResponse.latencyMs}ms
                </Typography>
              </Box>
              {lastResponse.validationErrors && lastResponse.validationErrors.length > 0 && (
                <Box
                  sx={{
                    p: 1,
                    bgcolor: theme.chip?.approvalStatus?.rejected ? theme.chip.approvalStatus.rejected + '15' : '#FFEBEE',
                    border: `1px solid ${theme.palette.error.main}`,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.error.main, display: 'block', mb: 0.75 }}>
                    Validation Errors:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {lastResponse.validationErrors.map((error, idx) => (
                      <Typography key={idx} variant="caption" sx={{ color: theme.palette.error.main, fontFamily: 'monospace' }}>
                        • {error}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
              <CodeEditor
                value={safeJson(lastResponse.response ?? lastResponse.error ?? '')}
                height={lastResponse.validationErrors && lastResponse.validationErrors.length > 0 ? 'calc(100vh - 320px)' : 'calc(100vh - 220px)'}
                editable={false}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
