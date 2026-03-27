import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import toast from 'react-hot-toast';
import { Plus, Play, Zap, ArrowLeft, Save, Trash2, X, ChevronRight, KeyRound } from 'lucide-react';
import { flowsApi, aiApi } from '../services/api';
import { Button, Spinner, Modal, Input, Select, EmptyState } from '../components/ui';
import styles from './FlowDesignerPage.module.css';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const METHOD_COLORS = {
  GET: '#3b82f6', POST: '#22c55e', PUT: '#f59e0b',
  PATCH: '#8b5cf6', DELETE: '#ef4444',
};

function normalizeAuthTemplate(rawValue) {
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (!trimmed) return '';

    try {
      const parsed = JSON.parse(trimmed);
      const normalized = normalizeAuthTemplate(parsed);
      return normalized || trimmed;
    } catch {
      return trimmed;
    }
  }

  if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
    const directAuth = rawValue.Authorization ?? rawValue.authorization;
    if (typeof directAuth === 'string' && directAuth.trim()) {
      return directAuth.trim();
    }

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

  return '';
}

/* ── Custom node ─────────────────────────────────────────── */
function StepNode({ id, data, selected }) {
  // Prefer step-level Authorization, otherwise fall back to flow-level Authorization.
  const stepAuthHeader = data.headers?.Authorization || data.headers?.authorization
    || data.injectVariables?.Authorization || data.injectVariables?.authorization;

  const flowAuthHeader = data.flowAuthTemplate;

  const authHeader = stepAuthHeader || flowAuthHeader;
  const authIsFlowLevel = !stepAuthHeader && !!flowAuthHeader;

  // Show extract variable keys (what this step produces)
  const extractKeys = Object.keys(data.extractVariables || {});

  // Show inject variable keys (what this step consumes)
  const injectKeys  = Object.keys(data.injectVariables  || {});

  return (
    <div className={`${styles.stepNode} ${selected ? styles.stepNodeSelected : ''}`}>
      <Handle type="target" position={Position.Left} className={styles.handle} />

      {/* delete button top-right */}
      <button
        className={styles.nodeDeleteBtn}
        onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
        title="Remove step"
      >
        <X size={10} />
      </button>

      {/* header row: method + name */}
      <div className={styles.stepNodeHeader}>
        <span className={styles.stepMethod} style={{ color: METHOD_COLORS[data.method] || '#6b7280' }}>
          {data.method}
        </span>
        <span className={styles.stepName}>{data.label}</span>
      </div>

      {/* URL */}
      <div className={styles.stepUrl}>{data.url || '—'}</div>

      {/* Auth header display */}
      {authHeader && (
        <div className={styles.stepAuthRow}>
          <span className={styles.stepAuthKey}>Authorization{authIsFlowLevel ? ' (flow)' : ''}</span>
          <span className={styles.stepAuthVal}>
            {authHeader.length > 28 ? authHeader.slice(0, 28) + '…' : authHeader}
          </span>
        </div>
      )}

      {/* Variable badges */}
      {(extractKeys.length > 0 || injectKeys.length > 0) && (
        <div className={styles.stepVarRow}>
          {extractKeys.map(k => (
            <span key={k} className={styles.stepVarExtract} title={`Extracts: ${k}`}>
              ↑ {k}
            </span>
          ))}
          {injectKeys.map(k => (
            <span key={k} className={styles.stepVarInject} title={`Injects: ${k}`}>
              ↓ {k}
            </span>
          ))}
        </div>
      )}

      {/* Run result */}
      {data.result && (
        <div className={`${styles.stepResult} ${data.result.passed ? styles.stepPass : styles.stepFail}`}>
          {data.result.statusCode} · {data.result.latencyMs}ms
        </div>
      )}

      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  );
}

const nodeTypes = { step: StepNode };

let stepIdCounter = 1;

function FlowDesignerInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getViewport, project } = useReactFlow();

  const [flows, setFlows]           = useState([]);
  const [activeFlow, setActiveFlow] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [running, setRunning]       = useState(false);
  const [runResult, setRunResult]   = useState(null);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Step editor sidebar
  const [editingStep, setEditingStep] = useState(null);
  const [stepForm, setStepForm]       = useState({});

  // New flow modal
  const [showNewFlow, setShowNewFlow]   = useState(false);
  const [newFlowName, setNewFlowName]   = useState('');

  // Flow-level auth template (applies to all steps)
  // Example: "Bearer {{token}}" where token is extracted from the login step.
  const [flowAuthTemplate, setFlowAuthTemplate] = useState('');
  const [showFlowAuth, setShowFlowAuth]         = useState(false);
  const [flowAuthDraft, setFlowAuthDraft]       = useState('');

  useEffect(() => { fetchFlows(); }, []);

  useEffect(() => {
    if (id && flows.length) {
      const f = flows.find((f) => f._id === id);
      if (f) loadFlow(f);
    }
  }, [id, flows]);

  const fetchFlows = async () => {
    try {
      const data = await flowsApi.getAll();
      setFlows(data);
      if (data.length && !id) loadFlow(data[0]);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* delete a node (and its connected edges) — defined BEFORE loadFlow/makeNodeData */
  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (editingStep?.id === nodeId) setEditingStep(null);
  }, [editingStep]);

  /* build node data with the delete callback */
  const makeNodeData = useCallback((base) => ({
    ...base,
    onDelete: handleDeleteNode,
    flowAuthTemplate,
  }), [handleDeleteNode, flowAuthTemplate]);

  const loadFlow = useCallback((flow) => {
    const authTpl = normalizeAuthTemplate(flow?.globalInjectVariables?.Authorization);

    setActiveFlow(flow);
    setFlowAuthTemplate(authTpl);
    setRunResult(null);
    setAiAnalysis(null);

    const n = (flow.steps || []).map((step) => ({
      id: step.id,
      type: 'step',
      position: step.position || { x: 100, y: 100 },
      data: {
        label: step.name,
        method: step.method || 'GET',
        url: step.url || '',
        body: step.body || {},
        headers: step.headers || {},
        extractVariables: step.extractVariables || {},
        injectVariables: step.injectVariables || {},
        flowAuthTemplate: authTpl,
        onDelete: handleDeleteNode,
      },
    }));

    const e = [];
    for (let i = 0; i < (flow.steps || []).length - 1; i++) {
      const s    = flow.steps[i];
      const next = flow.steps[i + 1];
      if (s.nextStepId) {
        const injectKeys = Object.keys(next?.injectVariables || {});
        const label = injectKeys.length > 0 ? `{{${injectKeys.join(', ')}}}` : undefined;
        e.push({
          id: `e-${s.id}-${s.nextStepId}`,
          source: s.id,
          target: s.nextStepId,
          animated: true,
          label,
          labelStyle: { fontSize: 10, fontFamily: 'monospace', fill: '#7c3aed', fontWeight: 600 },
          labelBgStyle: { fill: '#f5f3ff', fillOpacity: 0.95 },
          labelBgPadding: [4, 6],
          labelBgBorderRadius: 4,
          style: { stroke: '#8b5cf6', strokeWidth: 1.5, strokeDasharray: '6 3' },
        });
      }
    }

    setNodes(n);
    setEdges(e);
  }, [handleDeleteNode]);

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return toast.error('Enter a flow name');
    try {
      const flow = await flowsApi.create({ name: newFlowName, steps: [], globalInjectVariables: {} });
      setFlows((prev) => [flow, ...prev]);
      loadFlow(flow);
      setShowNewFlow(false);
      setNewFlowName('');
      navigate(`/flows/${flow._id}`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const deleteFlow = async (fid) => {
    try {
      await flowsApi.remove(fid);
      const updated = flows.filter((f) => f._id !== fid);
      setFlows(updated);
      if (activeFlow?._id === fid) {
        if (updated.length) { loadFlow(updated[0]); navigate(`/flows/${updated[0]._id}`); }
        else { setActiveFlow(null); setNodes([]); setEdges([]); navigate('/flows'); }
      }
      toast.success('Flow deleted');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDeleteFlow = (fid) => {
    const flowName = flows.find((f) => f._id === fid)?.name || 'this flow';

    toast.custom(
      (t) => (
        <div className={`${styles.deleteFlowToast} ${t.visible ? styles.deleteFlowToastIn : styles.deleteFlowToastOut}`}>
          <div className={styles.deleteFlowToastTitle}>Delete flow?</div>
          <div className={styles.deleteFlowToastText}>
            {`"${flowName}" will be deleted permanently.`}
          </div>
          <div className={styles.deleteFlowToastActions}>
            <button
              className={`${styles.deleteFlowToastBtn} ${styles.deleteFlowToastBtnCancel}`}
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
            <button
              className={`${styles.deleteFlowToastBtn} ${styles.deleteFlowToastBtnDelete}`}
              onClick={() => {
                toast.dismiss(t.id);
                void deleteFlow(fid);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { id: `delete-flow-${fid}`, duration: 9000, position: 'top-center' }
    );
  };

  /* add step at current viewport center */
  const addStep = useCallback(() => {
    const stepId = `step-${stepIdCounter++}`;

    // Get the canvas element to find its dimensions
    const canvasEl = document.querySelector('.react-flow__renderer');
    const canvasW  = canvasEl?.clientWidth  ?? 800;
    const canvasH  = canvasEl?.clientHeight ?? 500;

    // Convert screen center to flow coordinates
    const center = project({
      x: canvasW / 2,
      y: canvasH / 2,
    });

    // Slight random jitter so stacked nodes don't perfectly overlap
    const jitter = () => (Math.random() - 0.5) * 60;

    const newNode = {
      id: stepId,
      type: 'step',
      position: { x: center.x + jitter(), y: center.y + jitter() },
      data: makeNodeData({
        label: `Step ${nodes.length + 1}`,
        method: 'GET',
        url: '',
        body: {},
        headers: {},
        extractVariables: {},
        injectVariables: {},
      }),
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, project, makeNodeData]);

  const onConnect = useCallback(
    (params) => {
      // Find the target node's injectVariables to label the edge
      const targetNode = nodes.find(n => n.id === params.target);
      const injectKeys = Object.keys(targetNode?.data?.injectVariables || {});
      const label = injectKeys.length > 0
        ? `{{${injectKeys.join(', ')}}}`
        : undefined;

      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        label,
        labelStyle: { fontSize: 10, fontFamily: 'var(--font-mono)', fill: '#7c3aed', fontWeight: 600 },
        labelBgStyle: { fill: '#f5f3ff', fillOpacity: 0.95 },
        labelBgPadding: [4, 6],
        labelBgBorderRadius: 4,
        style: { stroke: '#8b5cf6', strokeWidth: 1.5, strokeDasharray: '6 3' },
      }, eds));
    },
    [setEdges, nodes]
  );

  const onNodeClick = useCallback((_, node) => {
    setEditingStep(node);
    setStepForm({
      label: node.data.label,
      method: node.data.method,
      url: node.data.url,
      headers: JSON.stringify(node.data.headers || {}, null, 2),
      body: JSON.stringify(node.data.body || {}, null, 2),
      extractVariables: JSON.stringify(node.data.extractVariables || {}, null, 2),
      injectVariables: JSON.stringify(node.data.injectVariables || {}, null, 2),
    });
  }, []);

  const handleUpdateStep = () => {
    if (!editingStep) return;
    const tryParse = (str) => { try { return JSON.parse(str); } catch { return {}; } };

    setNodes((nds) =>
      nds.map((n) =>
        n.id === editingStep.id
          ? {
              ...n,
              data: {
                ...n.data,
                label:            stepForm.label,
                method:           stepForm.method,
                url:              stepForm.url,
                headers:          tryParse(stepForm.headers),
                body:             tryParse(stepForm.body),
                extractVariables: tryParse(stepForm.extractVariables),
                injectVariables:  tryParse(stepForm.injectVariables),
              },
            }
          : n
      )
    );
    setEditingStep(null);
    toast.success('Step updated');
  };

  const handleSaveFlow = async () => {
    if (!activeFlow) return;
    setSaving(true);
    try {
      const steps = nodes.map((n, i) => {
        const outEdge = edges.find((e) => e.source === n.id);
        return {
          id: n.id,
          name: n.data.label,
          method: n.data.method,
          url: n.data.url,
          headers: n.data.headers || {},
          body: n.data.body || {},
          extractVariables: n.data.extractVariables || {},
          injectVariables: n.data.injectVariables || {},
          position: n.position,
          nextStepId: outEdge?.target || null,
        };
      });

      const existingGlobalInjectVariables =
        activeFlow.globalInjectVariables && typeof activeFlow.globalInjectVariables === 'object'
          ? activeFlow.globalInjectVariables
          : {};

      const globalInjectVariables = { ...existingGlobalInjectVariables };
      const normalizedAuth = normalizeAuthTemplate(flowAuthTemplate);

      if (normalizedAuth) globalInjectVariables.Authorization = normalizedAuth;
      else delete globalInjectVariables.Authorization;

      const updated = await flowsApi.update(activeFlow._id, { steps, globalInjectVariables });
      setActiveFlow(updated);
      setFlows((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
      toast.success('Flow saved');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRunFlow = async () => {
    if (!activeFlow) return;
    await handleSaveFlow();
    setRunning(true);
    setRunResult(null);
    try {
      const result = await flowsApi.run(activeFlow._id);
      setRunResult(result);

      // Overlay results on nodes
      setNodes((nds) =>
        nds.map((n) => {
          const stepResult = result.steps.find((s) => s.stepId === n.id);
          return stepResult
            ? { ...n, data: { ...n.data, result: stepResult } }
            : n;
        })
      );

      toast.success(`Flow complete: ${result.passedSteps}/${result.totalSteps} steps passed`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  const handleAiAnalyze = async () => {
    if (!nodes.length) return toast.error('Add steps to the flow first');
    setAiLoading(true);
    try {
      const steps = nodes.map((n) => ({
        name: n.data.label,
        method: n.data.method,
        url: n.data.url,
        extractVariables: n.data.extractVariables,
      }));
      const analysis = await aiApi.analyzeFlow({ steps });
      setAiAnalysis(analysis);
      toast.success('AI analysis complete');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className={styles.center}><Spinner size={28} /></div>;

  return (
    <div className={styles.page}>
      {/* Left sidebar: flow list */}
      <aside className={styles.flowList}>
        <div className={styles.flowListHeader}>
          <span className={styles.flowListTitle}>Flows</span>
          <button className={styles.addBtn} onClick={() => setShowNewFlow(true)}>
            <Plus size={13} /> New
          </button>
        </div>

        {flows.length === 0 && (
          <p className={styles.emptyMsg}>No flows yet.</p>
        )}

        {flows.map((f) => (
          <div
            key={f._id}
            className={`${styles.flowItem} ${activeFlow?._id === f._id ? styles.flowItemActive : ''}`}
            onClick={() => { loadFlow(f); navigate(`/flows/${f._id}`); }}
          >
            <span className={styles.flowItemName}>{f.name}</span>
            <button
              className={styles.removeBtn}
              onClick={(e) => { e.stopPropagation(); handleDeleteFlow(f._id); }}
            ><Trash2 size={12} /></button>
          </div>
        ))}
      </aside>

      {/* Main canvas area */}
      <div className={styles.canvasWrap}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <button className={styles.backBtn} onClick={() => navigate('/')}><ArrowLeft size={15} /></button>
            <span className={styles.flowTitle}>{activeFlow?.name || 'Flow Designer'}</span>
          </div>
          <div className={styles.toolbarRight}>
            {activeFlow && (
              <>
                <Button variant="outline" size="sm" onClick={addStep}><Plus size={13} /> Add Step</Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFlowAuthDraft(normalizeAuthTemplate(flowAuthTemplate));
                    setShowFlowAuth(true);
                  }}
                >
                  <KeyRound size={13} /> Flow Auth
                </Button>
                <Button variant="outline" size="sm" onClick={handleAiAnalyze} loading={aiLoading}>
                  <Zap size={13} /> AI Analyze
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveFlow} loading={saving}>
                  <Save size={13} /> Save
                </Button>
                <Button size="sm" onClick={handleRunFlow} loading={running}>
                  <Play size={13} /> Run Flow
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Canvas */}
        {!activeFlow ? (
          <div className={styles.emptyCanvas}>
            <EmptyState
              title="No flow selected"
              description="Create a new flow or select one from the left panel."
              action={<Button onClick={() => setShowNewFlow(true)}><Plus size={14} /> New Flow</Button>}
            />
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className={styles.flow}
          >
            <Background color="#e5e7eb" gap={20} />
            <Controls />
            <MiniMap nodeColor="#8b5cf6" maskColor="rgba(240,242,245,0.8)" />
          </ReactFlow>
        )}

        {/* Run result panel */}
        {/* {runResult && (
          <div className={styles.resultPanel}>
            <div className={styles.resultPanelHeader}>
              <span className={styles.resultPanelTitle}>Run Result</span>
              <button className={styles.removeBtn} onClick={() => setRunResult(null)}><X size={14} /></button>
            </div>
            <div className={styles.resultSummary}>
              <span className={styles.resultStat}>{runResult.totalSteps} steps</span>
              <span className={`${styles.resultStat} ${styles.resultPass}`}>{runResult.passedSteps} passed</span>
              <span className={`${styles.resultStat} ${styles.resultFail}`}>{runResult.failedSteps} failed</span>
            </div>
            <div className={styles.stepResults}>
              {runResult.steps.map((s, i) => (
                <div key={i} className={styles.stepResultRow}>
                  <ChevronRight size={12} className={styles.stepArrow} />
                  <span className={styles.stepResultName}>{s.stepName}</span>
                  <span className={`${styles.stepStatus} ${s.passed ? styles.stepPass : styles.stepFail}`}>
                    {s.statusCode}
                  </span>
                  <span className={styles.stepLatency}>{s.latencyMs}ms</span>
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* AI Analysis panel — bottom drawer */}
        {aiAnalysis && (
          <div className={styles.aiPanel}>
            {/* drawer header */}
            <div className={styles.resultPanelHeader} style={{ flexShrink: 0 }}>
              <span className={styles.resultPanelTitle}>AI Analysis</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {aiAnalysis.negativeFlows?.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {aiAnalysis.negativeFlows.length} negative flow{aiAnalysis.negativeFlows.length !== 1 ? 's' : ''}
                  </span>
                )}
                {aiAnalysis.securityConcerns?.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--red-500)', fontWeight: 600 }}>
                    {aiAnalysis.securityConcerns.length} security concern{aiAnalysis.securityConcerns.length !== 1 ? 's' : ''}
                  </span>
                )}
                <button className={styles.removeBtn} onClick={() => setAiAnalysis(null)}><X size={14} /></button>
              </div>
            </div>

            {/* two-column content */}
            <div className={styles.aiDrawerBody}>
              {aiAnalysis.negativeFlows?.length > 0 && (
                <div className={styles.aiDrawerCol}>
                  <p className={styles.aiSectionTitle}>Negative Flows</p>
                  <div className={styles.aiItemList}>
                    {aiAnalysis.negativeFlows.map((nf, i) => (
                      <div key={i} className={`${styles.aiItem} ${nf.severity === 'high' ? styles.aiHigh : nf.severity === 'medium' ? styles.aiMedium : styles.aiLow}`}>
                        <p className={styles.aiItemTitle}>{nf.name}</p>
                        <p className={styles.aiItemDesc}>{nf.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {aiAnalysis.securityConcerns?.length > 0 && (
                <div className={styles.aiDrawerCol}>
                  <p className={styles.aiSectionTitle}>Security Concerns</p>
                  <div className={styles.aiItemList}>
                    {aiAnalysis.securityConcerns.map((sc, i) => (
                      <div key={i} className={`${styles.aiItem} ${styles.aiHigh}`}>
                        <p className={styles.aiItemTitle}>{sc.concern}</p>
                        <p className={styles.aiItemDesc}>Step: {sc.step} · Severity: {sc.severity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {aiAnalysis.suggestions?.length > 0 && (
                <div className={styles.aiDrawerCol}>
                  <p className={styles.aiSectionTitle}>Suggestions</p>
                  <div className={styles.aiItemList}>
                    {aiAnalysis.suggestions.map((s, i) => (
                      <div key={i} className={`${styles.aiItem} ${styles.aiLow}`}>
                        <p className={styles.aiItemDesc}>{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step editor sidebar */}
      {editingStep && (
        <aside className={styles.stepEditor}>
          <div className={styles.stepEditorHeader}>
            <span className={styles.stepEditorTitle}>Edit Step</span>
            <button className={styles.removeBtn} onClick={() => setEditingStep(null)}><X size={14} /></button>
          </div>
          <div className={styles.stepEditorBody}>
            <div className={styles.editorField}>
              <label className={styles.editorLabel}>Name</label>
              <input className={styles.editorInput} value={stepForm.label || ''} onChange={(e) => setStepForm((p) => ({ ...p, label: e.target.value }))} />
            </div>
            <div className={styles.editorRow}>
              <div className={styles.editorField} style={{ width: 90 }}>
                <label className={styles.editorLabel}>Method</label>
                <select className={styles.editorSelect} value={stepForm.method || 'GET'} onChange={(e) => setStepForm((p) => ({ ...p, method: e.target.value }))}>
                  {METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className={styles.editorField} style={{ flex: 1 }}>
                <label className={styles.editorLabel}>URL</label>
                <input className={styles.editorInput} value={stepForm.url || ''} onChange={(e) => setStepForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <div className={styles.editorField}>
              <label className={styles.editorLabel}>Headers (JSON)</label>
              <textarea className={styles.editorTextarea} rows={3} value={stepForm.headers || '{}'} onChange={(e) => setStepForm((p) => ({ ...p, headers: e.target.value }))} />
            </div>
            <div className={styles.editorField}>
              <label className={styles.editorLabel}>Body (JSON)</label>
              <textarea className={styles.editorTextarea} rows={4} value={stepForm.body || '{}'} onChange={(e) => setStepForm((p) => ({ ...p, body: e.target.value }))} />
            </div>
            <div className={styles.editorField}>
              <label className={styles.editorLabel}>Extract Variables</label>
              <textarea className={styles.editorTextarea} rows={3} value={stepForm.extractVariables || '{}'} onChange={(e) => setStepForm((p) => ({ ...p, extractVariables: e.target.value }))} placeholder='{"token": "$.data.token"}' />
            </div>
            <div className={styles.editorField}>
              <label className={styles.editorLabel}>Inject Variables</label>
              <textarea className={styles.editorTextarea} rows={3} value={stepForm.injectVariables || '{}'} onChange={(e) => setStepForm((p) => ({ ...p, injectVariables: e.target.value }))} placeholder='{"Authorization": "Bearer {{token}}"}' />
            </div>
            <Button size="sm" onClick={handleUpdateStep} style={{ width: '100%' }}>
              <Save size={13} /> Save Step
            </Button>
          </div>
        </aside>
      )}

      {/* Flow Auth Modal */}
      <Modal open={showFlowAuth} onClose={() => setShowFlowAuth(false)} title="Flow Authorization">
        <div className={styles.newFlowForm}>
          <Input
            label="Authorization header template (applies to all steps)"
            placeholder="Bearer {{token}}"
            value={flowAuthDraft}
            onChange={(e) => setFlowAuthDraft(e.target.value)}
          />
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            Tip: extract the token in your login step (e.g. <code>{'"token": "$.data.token"'}</code>) and
            use <code>{'{{token}}'}</code> here.
          </p>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setShowFlowAuth(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const normalizedAuth = normalizeAuthTemplate(flowAuthDraft);
                setFlowAuthTemplate(normalizedAuth);

                setActiveFlow((prev) => {
                  if (!prev) return prev;
                  const gi =
                    prev.globalInjectVariables && typeof prev.globalInjectVariables === 'object'
                      ? { ...prev.globalInjectVariables }
                      : {};

                  if (normalizedAuth) gi.Authorization = normalizedAuth;
                  else delete gi.Authorization;

                  return { ...prev, globalInjectVariables: gi };
                });

                setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, flowAuthTemplate: normalizedAuth } })));
                setShowFlowAuth(false);
                toast.success('Flow auth updated (remember to Save)');
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Flow Modal */}
      <Modal open={showNewFlow} onClose={() => setShowNewFlow(false)} title="New Flow">
        <div className={styles.newFlowForm}>
          <Input label="Flow Name" placeholder="e.g. User Auth Flow" value={newFlowName} onChange={(e) => setNewFlowName(e.target.value)} />
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setShowNewFlow(false)}>Cancel</Button>
            <Button onClick={handleCreateFlow}>Create Flow</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ── Wrap with ReactFlowProvider so useReactFlow() works ──── */
export default function FlowDesignerPage() {
  return (
    <ReactFlowProvider>
      <FlowDesignerInner />
    </ReactFlowProvider>
  );
}
