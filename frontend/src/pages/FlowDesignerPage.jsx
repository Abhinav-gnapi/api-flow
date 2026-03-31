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
import { useInlinePageStyles } from '../theme/useInlinePageStyles';


const styles = new Proxy({}, { get: (_, key) => String(key) });
const FLOW_DESIGNER_PAGE_STYLES = String.raw`.page {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-page);
}

.center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

/* â”€â”€ Flow list sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.flowList {
  width: 200px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.flowListHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16.5px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.flowListTitle {
  font-size: var(--type-subtitle2-font-size);
  font-weight: 600;
  line-height: var(--type-subtitle2-line-height);
  letter-spacing: var(--type-subtitle2-letter-spacing);
  color: var(--text-primary);
}

.addBtn {
  display: flex; align-items: center; gap: 3px;
  background: transparent; border: none;
  color: var(--purple-600);
  font-size: var(--type-caption-font-size);
  font-weight: 600;
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  cursor: pointer; padding: 3px 6px; border-radius: var(--radius-sm);
}
.addBtn:hover { background: var(--purple-50); }

.emptyMsg {
  font-size: var(--type-body2-font-size);
  font-weight: var(--type-body2-font-weight);
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  color: var(--text-muted);
  text-align: center; padding: 20px 12px;
}

.flowItem {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 12px; cursor: pointer; gap: 6px;
  border-bottom: 1px solid var(--border);
  transition: background 0.12s;
}
.flowItem:hover { background: var(--bg-hover); }
.flowItemActive { background: var(--bg-selected); }

.flowItemName {
  font-size: var(--type-subtitle2-font-size);
  font-weight: var(--type-subtitle2-font-weight);
  line-height: var(--type-subtitle2-line-height);
  letter-spacing: var(--type-subtitle2-letter-spacing);
  color: var(--text-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  flex: 1;
}

.removeBtn {
  width: 22px; height: 22px; border: none; background: transparent;
  color: var(--text-muted); cursor: pointer; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.removeBtn:hover { background: #fee2e2; color: var(--red-500); }

/* â”€â”€ Canvas wrap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.canvasWrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14.5px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 12px;
}

.toolbarLeft { display: flex; align-items: center; gap: 10px; }
.toolbarRight { display: flex; align-items: center; gap: 8px; }

.backBtn {
  width: 30px; height: 30px; border: 1px solid var(--border);
  background: transparent; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--text-secondary);
}
.backBtn:hover { background: var(--bg-hover); }

.flowTitle {
  font-size: var(--type-subtitle1-font-size);
  font-weight: 600;
  line-height: var(--type-subtitle1-line-height);
  letter-spacing: var(--type-subtitle1-letter-spacing);
  color: var(--text-primary);
}

.emptyCanvas {
  flex: 1; display: flex; align-items: center; justify-content: center;
}

.flow { flex: 1; }

/* Custom node */
.stepNode {
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
  min-width: 180px;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.15s, box-shadow 0.15s;
  position: relative;
}

/* delete âœ• button — top-right corner of node */
.nodeDeleteBtn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--red-500);
  border: 2px solid #fff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 10;
  padding: 0;
  line-height: 1;
}
.stepNode:hover .nodeDeleteBtn { opacity: 1; }
.stepNodeSelected {
  border-color: var(--purple-500);
  box-shadow: 0 0 0 2px var(--purple-100);
}

.stepNodeHeader {
  display: flex; align-items: center; gap: 7px;
  margin-bottom: 4px;
}

.stepMethod {
  font-size: var(--type-caption-font-size);
  font-weight: 700;
  line-height: var(--type-caption-line-height);
  font-family: var(--font-mono);
}
.stepName {
  font-size: var(--type-subtitle2-font-size);
  font-weight: 600;
  line-height: var(--type-subtitle2-line-height);
  letter-spacing: var(--type-subtitle2-letter-spacing);
  color: var(--text-primary);
}

.stepUrl {
  font-size: var(--type-caption-font-size);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-muted);
  font-family: var(--font-mono);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  max-width: 200px;
}

.stepResult {
  margin-top: 6px;
  font-size: var(--type-caption-font-size);
  font-weight: 600;
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  padding: 2px 8px; border-radius: var(--radius-full);
  display: inline-block; font-family: var(--font-mono);
}
.stepPass { background: #dcfce7; color: #15803d; }
.stepFail { background: #fee2e2; color: #b91c1c; }

/* Auth header display inside node */
.stepAuthRow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 4px 7px;
  background: var(--purple-50);
  border: 1px solid var(--purple-100);
  border-radius: var(--radius-sm);
}
.stepAuthKey {
  font-size: var(--type-overline-font-size);
  font-weight: 700;
  line-height: var(--type-overline-line-height);
  letter-spacing: var(--type-overline-letter-spacing);
  text-transform: var(--type-overline-text-transform);
  color: var(--purple-600);
  font-family: var(--font-mono);
  flex-shrink: 0;
}
.stepAuthVal {
  font-size: var(--type-caption-font-size);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-muted);
  font-family: var(--font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Variable badges inside node */
.stepVarRow {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.stepVarExtract {
  font-size: var(--type-caption-font-size);
  font-weight: 600;
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: #dcfce7;
  color: #15803d;
  font-family: var(--font-mono);
}
.stepVarInject {
  font-size: var(--type-caption-font-size);
  font-weight: 600;
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: var(--purple-100);
  color: var(--purple-700);
  font-family: var(--font-mono);
}

.handle {
  width: 10px !important; height: 10px !important;
  background: var(--purple-500) !important;
  border: 2px solid #fff !important;
}

/* Result panel — top-right overlay */
.resultPanel {
  position: absolute;
  top: 60px; right: 12px;
  width: 260px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 10;
}

/* AI Analysis panel bottom drawer */
.aiPanel {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  max-height: 260px;
  background: var(--bg-card);
  border-top: 2px solid var(--border);
  box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
  overflow-y: auto;
  z-index: 10;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.resultPanelHeader {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px 10px; border-bottom: 1px solid var(--border);
}
.resultPanelTitle {
  font-size: var(--type-subtitle2-font-size);
  font-weight: 600;
  line-height: var(--type-subtitle2-line-height);
  letter-spacing: var(--type-subtitle2-letter-spacing);
  color: var(--text-primary);
}

.resultSummary {
  display: flex; gap: 10px; padding: 8px 14px;
  border-bottom: 1px solid var(--border);
}
.resultStat {
  font-size: var(--type-body2-font-size);
  font-weight: 600;
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  color: var(--text-secondary);
}
.resultPass { color: var(--green-600); }
.resultFail { color: var(--red-600); }

.stepResults { padding: 6px 0; }
.stepResultRow {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 14px;
}
.stepArrow { color: var(--text-muted); flex-shrink: 0; }
.stepResultName {
  font-size: var(--type-body2-font-size);
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.stepStatus {
  font-size: var(--type-caption-font-size);
  font-weight: 700;
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  font-family: var(--font-mono);
}
.stepLatency {
  font-size: var(--type-caption-font-size);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* â”€â”€ AI panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.aiDrawerBody {
  display: flex;
  flex-direction: row;
  gap: 0;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
}

.aiDrawerCol {
  min-width: 260px;
  max-width: 340px;
  flex: 1;
  padding: 10px 14px;
  border-right: 1px solid var(--border);
  overflow-y: auto;
}
.aiDrawerCol:last-child { border-right: none; }

.aiItemList { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }

.aiSection { padding: 10px 14px; border-bottom: 1px solid var(--border); }
.aiSectionTitle {
  font-size: var(--type-overline-font-size);
  font-weight: 700;
  line-height: var(--type-overline-line-height);
  letter-spacing: var(--type-overline-letter-spacing);
  text-transform: var(--type-overline-text-transform);
  color: var(--text-muted);
  margin-bottom: 8px;
}
.aiItem { padding: 8px 10px; border-radius: var(--radius-md); margin-bottom: 6px; }
.aiHigh   { background: #fff1f1; border-left: 3px solid var(--red-500); }
.aiMedium { background: #fffbeb; border-left: 3px solid var(--yellow-500); }
.aiLow    { background: var(--bg-code); border-left: 3px solid var(--border); }
.aiItemTitle {
  font-size: var(--type-body2-font-size);
  font-weight: 600;
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  color: var(--text-primary);
}
.aiItemDesc {
  font-size: var(--type-caption-font-size);
  font-weight: var(--type-caption-font-weight);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-secondary);
  margin-top: 2px;
}

/* â”€â”€ Step editor sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.stepEditor {
  width: 280px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stepEditorHeader {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.stepEditorTitle {
  font-size: var(--type-subtitle2-font-size);
  font-weight: 600;
  line-height: var(--type-subtitle2-line-height);
  letter-spacing: var(--type-subtitle2-letter-spacing);
  color: var(--text-primary);
}

.stepEditorBody {
  flex: 1; overflow-y: auto; padding: 14px 14px 20px;
  display: flex; flex-direction: column; gap: 12px;
}

.editorField { display: flex; flex-direction: column; gap: 4px; }
.editorLabel {
  font-size: var(--type-caption-font-size);
  font-weight: var(--type-subtitle2-font-weight);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-secondary);
}

.editorRow { display: flex; gap: 8px; align-items: flex-end; }

.editorInput {
  padding: 7px 10px;
  border: 1px solid var(--border); border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--type-body2-font-size);
  font-weight: var(--type-body2-font-weight);
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  background: var(--bg-input); color: var(--text-primary); width: 100%;
}
.editorInput:focus { outline: none; border-color: var(--border-focus); }

.editorSelect {
  padding: 7px 10px; border: 1px solid var(--border);
  border-radius: var(--radius-md); font-family: var(--font-sans);
  font-size: var(--type-body2-font-size);
  font-weight: var(--type-body2-font-weight);
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  background: var(--bg-input); width: 100%;
}
.editorSelect:focus { outline: none; border-color: var(--border-focus); }

.editorTextarea {
  padding: 7px 10px;
  border: 1px solid var(--border); border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: var(--type-caption-font-size);
  font-weight: var(--type-caption-font-weight);
  letter-spacing: var(--type-caption-letter-spacing);
  resize: vertical;
  background: var(--bg-code); color: var(--text-primary); width: 100%;
  line-height: 1.5;
}
.editorTextarea:focus { outline: none; border-color: var(--border-focus); }

/* â”€â”€ New flow modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.newFlowForm { display: flex; flex-direction: column; gap: 14px; }
.modalActions { display: flex; justify-content: flex-end; gap: 8px; }

/* Delete flow confirmation snackbar */
.deleteFlowToast {
  min-width: 320px;
  max-width: min(92vw, 420px);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 12px 14px;
}

.deleteFlowToastIn {
  animation: deleteFlowToastIn 0.18s ease-out;
}

.deleteFlowToastOut {
  animation: deleteFlowToastOut 0.16s ease-in forwards;
}

.deleteFlowToastTitle {
  font-size: var(--type-subtitle2-font-size);
  font-weight: 700;
  line-height: var(--type-subtitle2-line-height);
  letter-spacing: var(--type-subtitle2-letter-spacing);
  color: var(--text-primary);
}

.deleteFlowToastText {
  font-size: var(--type-body2-font-size);
  font-weight: var(--type-body2-font-weight);
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  color: var(--text-secondary);
  margin-top: 4px;
  word-break: break-word;
}

.deleteFlowToastActions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.deleteFlowToastBtn {
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--type-button-font-size);
  font-weight: var(--type-button-font-weight);
  line-height: var(--type-button-line-height);
  letter-spacing: var(--type-button-letter-spacing);
  text-transform: var(--type-button-text-transform);
  padding: 5px 12px;
  cursor: pointer;
}

.deleteFlowToastBtnCancel {
  border-color: var(--border);
  color: var(--text-secondary);
  background: transparent;
}

.deleteFlowToastBtnCancel:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.deleteFlowToastBtnDelete {
  border-color: var(--red-500);
  color: #fff;
  background: var(--red-500);
}

.deleteFlowToastBtnDelete:hover {
  background: var(--red-600);
}

@keyframes deleteFlowToastIn {
  from { opacity: 0; transform: translateY(-8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes deleteFlowToastOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(-6px) scale(0.98); }
}
`;

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
      <div className={styles.stepUrl}>{data.url}</div>

      {/* Auth header display */}
      {authHeader && (
        <div className={styles.stepAuthRow}>
          <span className={styles.stepAuthKey}>Authorization{authIsFlowLevel ? ' (flow)' : ''}</span>
          <span className={styles.stepAuthVal}>
            {authHeader.length > 28 ? authHeader.slice(0, 28) + 'â€¦' : authHeader}
          </span>
        </div>
      )}

      {/* Variable badges */}
      {(extractKeys.length > 0 || injectKeys.length > 0) && (
        <div className={styles.stepVarRow}>
          {extractKeys.map(k => (
            <span key={k} className={styles.stepVarExtract} title={`Extracts: ${k}`}>
              â†‘ {k}
            </span>
          ))}
          {injectKeys.map(k => (
            <span key={k} className={styles.stepVarInject} title={`Injects: ${k}`}>
              â†“ {k}
            </span>
          ))}
        </div>
      )}

      {/* Run result */}
      {data.result && (
        <div className={`${styles.stepResult} ${data.result.passed ? styles.stepPass : styles.stepFail}`}>
          {data.result.statusCode} Â· {data.result.latencyMs}ms
        </div>
      )}

      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  );
}

const nodeTypes = { step: StepNode };

let stepIdCounter = 1;

function FlowDesignerInner() {
  useInlinePageStyles('flow-designer-page-inline-styles', FLOW_DESIGNER_PAGE_STYLES);
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

  /* delete a node (and its connected edges) defined BEFORE loadFlow/makeNodeData */
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
          labelStyle: {
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            fill: '#7c3aed',
            fontWeight: 600,
          },
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

        {/* AI Analysis panel bottom drawer */}
        {aiAnalysis && (
          <div className={styles.aiPanel}>
            {/* drawer header */}
            <div className={styles.resultPanelHeader} style={{ flexShrink: 0 }}>
              <span className={styles.resultPanelTitle}>AI Analysis</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {aiAnalysis.negativeFlows?.length > 0 && (
                  <span
                    style={{
                      fontSize: 'var(--type-overline-font-size)',
                      lineHeight: 'var(--type-overline-line-height)',
                      letterSpacing: 'var(--type-overline-letter-spacing)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {aiAnalysis.negativeFlows.length} negative flow{aiAnalysis.negativeFlows.length !== 1 ? 's' : ''}
                  </span>
                )}
                {aiAnalysis.securityConcerns?.length > 0 && (
                  <span
                    style={{
                      fontSize: 'var(--type-overline-font-size)',
                      lineHeight: 'var(--type-overline-line-height)',
                      letterSpacing: 'var(--type-overline-letter-spacing)',
                      color: 'var(--red-500)',
                      fontWeight: 600,
                    }}
                  >
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
                        <p className={styles.aiItemDesc}>Step: {sc.step} Â· Severity: {sc.severity}</p>
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
          <p
            style={{
              marginTop: 8,
              fontSize: 'var(--type-caption-font-size)',
              lineHeight: 'var(--type-caption-line-height)',
              letterSpacing: 'var(--type-caption-letter-spacing)',
              color: 'var(--text-muted)',
            }}
          >
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

/* â”€â”€ Wrap with ReactFlowProvider so useReactFlow() works â”€â”€â”€â”€ */
export default function FlowDesignerPage() {
  return (
    <ReactFlowProvider>
      <FlowDesignerInner />
    </ReactFlowProvider>
  );
}

