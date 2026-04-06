import { useState } from 'react';
import toast from 'react-hot-toast';
import { FileCode2, Link, CheckCircle2, ArrowRight, Database } from 'lucide-react';
import { postmanApi } from '../services/api';
import { Button, SectionHeader, Badge } from '../components/ui';
import { useInlinePageStyles } from '../theme/useInlinePageStyles';

const styles = new Proxy({}, { get: (_, key) => String(key) });
const POSTMAN_PAGE_STYLES = String.raw`.page {
  padding: 28px 32px;
  /* max-width: 1000px; */
}

.pageHeader { margin-bottom: 24px; }
.pageTitle  {
  font-size: var(--type-h5-font-size);
  font-weight: var(--type-h5-font-weight);
  line-height: var(--type-h5-line-height);
  letter-spacing: var(--type-h5-letter-spacing);
  color: var(--text-primary);
}
.pageSubtitle {
  font-size: var(--type-body1-font-size);
  font-weight: var(--type-body1-font-weight);
  line-height: var(--type-body1-line-height);
  letter-spacing: var(--type-body1-letter-spacing);
  color: var(--text-muted);
  margin-top: 3px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 20px 24px;
  margin-bottom: 16px;
}

.urlRow {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.urlInputWrap {
  flex: 1;
  display: flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: var(--bg-input);
  transition: border-color 0.15s;
}
.urlInputWrap:focus-within { border-color: var(--border-focus); }

.urlIcon { color: var(--text-muted); flex-shrink: 0; }

.urlInput {
  flex: 1;
  padding: 9px 10px;
  border: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: var(--type-body2-font-size);
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  color: var(--text-primary);
}
.urlInput:focus { outline: none; }

.hint {
  font-size: var(--type-caption-font-size);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-muted);
}
.hintLink {
  background: none; border: none; cursor: pointer;
  color: var(--purple-600);
  font-size: var(--type-caption-font-size);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  text-decoration: underline;
  font-family: var(--font-mono);
}

/* Parsed results */
.parsedHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.parsedTitle {
  font-size: var(--type-h6-font-size);
  font-weight: var(--type-h6-font-weight);
  line-height: var(--type-h6-line-height);
  letter-spacing: var(--type-h6-letter-spacing);
  color: var(--text-primary);
}

.parsedMeta {
  font-size: var(--type-body2-font-size);
  font-weight: var(--type-body2-font-weight);
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  color: var(--text-muted);
  margin-top: 2px;
}

.parsedActions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

/* Endpoint list */
.endpointList {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.endpointRow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.12s;
}
.endpointRow:last-child { border-bottom: none; }
.endpointRow:hover { background: var(--bg-hover); }
.endpointSelected { background: var(--bg-selected); }

.checkbox {
  width: 15px;
  height: 15px;
  cursor: pointer;
  accent-color: var(--purple-600);
  flex-shrink: 0;
}

.epMethod {
  font-size: var(--type-caption-font-size);
  font-weight: var(--type-subtitle2-font-weight);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  min-width: 52px;
  font-family: var(--font-mono);
}

.epPath {
  font-size: var(--type-caption-font-size);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  font-family: var(--font-mono);
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.epSummary {
  font-size: var(--type-caption-font-size);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;
}

.schemaBadge {
  font-size: var(--type-overline-font-size);
  line-height: var(--type-overline-line-height);
  letter-spacing: var(--type-overline-letter-spacing);
  flex-shrink: 0;
}

/* Success banner */
.successBanner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-xl);
}

.successIcon { color: var(--green-500); flex-shrink: 0; }

.successTitle {
  font-size: var(--type-subtitle2-font-size);
  font-weight: var(--type-subtitle2-font-weight);
  line-height: var(--type-subtitle2-line-height);
  letter-spacing: var(--type-subtitle2-letter-spacing);
  color: #15803d;
}
.successDesc  {
  font-size: var(--type-caption-font-size);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: #166534;
  margin-top: 2px;
}

.successBanner > :last-child { margin-left: auto; flex-shrink: 0; }

.postmanModeRow {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.postmanModeBtn {
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: var(--type-caption-font-size);
  font-weight: var(--type-subtitle2-font-weight);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  border-radius: var(--radius-md);
  padding: 6px 12px;
  cursor: pointer;
}

.postmanModeBtnActive {
  border-color: var(--purple-500);
  color: var(--purple-600);
  background: var(--purple-50);
}

.postmanJsonInput {
  width: 100%;
  min-height: 180px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  resize: vertical;
  font-family: var(--font-mono);
  font-size: var(--type-caption-font-size);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-primary);
  background: var(--bg-input);
}

.postmanJsonInput:focus {
  outline: none;
  border-color: var(--border-focus);
}

.postmanUploadWrap {
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
  background: #fafafa;
}

.postmanFileInput {
  width: 100%;
  font-size: var(--type-caption-font-size);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-secondary);
}

.postmanUploadHint {
  margin-top: 8px;
  font-size: var(--type-caption-font-size);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-muted);
}

.postmanActionRow {
  margin-top: 10px;
  display: flex;
  justify-content: flex-start;
}
`;

const METHOD_COLORS = {
  GET: '#3b82f6',
  POST: '#22c55e',
  PUT: '#f59e0b',
  PATCH: '#8b5cf6',
  DELETE: '#ef4444',
};

export default function PostmanPage() {
  useInlinePageStyles('postman-page-inline-styles', POSTMAN_PAGE_STYLES);
  const [inputMode, setInputMode] = useState('url');
  const [postmanUrl, setPostmanUrl] = useState('');
  const [postmanContent, setPostmanContent] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState([]);
  const [imported, setImported] = useState(false);

  const endpointSelectionKey = (index) => `endpoint-${index}`;

  const validateJsonContent = (content) => {
    const trimmed = content.trim();
    if (!trimmed) return false;
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  };

  const handleParse = async () => {
    const payload = {};
    if (inputMode === 'url') {
      if (!postmanUrl.trim()) return toast.error('Enter a Postman collection URL');
      payload.url = postmanUrl.trim();
    } else {
      if (!postmanContent.trim()) return toast.error('Add Postman collection JSON first');
      if (!validateJsonContent(postmanContent)) {
        return toast.error('Invalid JSON format');
      }
      payload.content = postmanContent.trim();
    }

    setLoading(true);
    setParsed(null);
    setSelected([]);
    setImported(false);
    try {
      const data = await postmanApi.parse(payload);
      setParsed(data);
      toast.success(`Found ${data.total} endpoints`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setPostmanContent(text);
      setUploadFileName(file.name);
      toast.success(`Loaded ${file.name}`);
    } catch {
      toast.error('Failed to read file');
    }
  };

  const toggleSelect = (methodPath) => {
    setImported(false);
    setSelected((prev) =>
      prev.includes(methodPath)
        ? prev.filter((x) => x !== methodPath)
        : [...prev, methodPath]
    );
  };

  const toggleAll = () => {
    if (!parsed) return;
    setImported(false);
    const allKeys = parsed.endpoints.map((_, index) => endpointSelectionKey(index));
    setSelected(selected.length === allKeys.length ? [] : allKeys);
  };

  const handleImport = async () => {
    if (!parsed || !selected.length) return toast.error('Select at least one endpoint');

    const endpoints = parsed.endpoints.filter((_, index) =>
      selected.includes(endpointSelectionKey(index))
    );

    setImporting(true);
    try {
      const res = await postmanApi.import({ endpoints, baseUrl: parsed.baseUrl });
      toast.success(`Imported ${res.created} API configs`);
      setImported(true);
      setSelected([]);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Postman Collection Import</h1>
        <p className={styles.pageSubtitle}>
          Parse a Postman collection URL and import selected requests as API configs.
        </p>
      </div>

      <div className={styles.card}>
        <SectionHeader
          title="Parse Postman Collection"
          subtitle="Use URL, paste JSON, or upload exported collection (v2/v2.1 JSON)."
        />
        <div className={styles.postmanModeRow}>
          <button
            className={`${styles.postmanModeBtn} ${inputMode === 'url' ? styles.postmanModeBtnActive : ''}`}
            onClick={() => setInputMode('url')}
          >
            URL
          </button>
          <button
            className={`${styles.postmanModeBtn} ${inputMode === 'paste' ? styles.postmanModeBtnActive : ''}`}
            onClick={() => setInputMode('paste')}
          >
            Paste JSON
          </button>
          <button
            className={`${styles.postmanModeBtn} ${inputMode === 'upload' ? styles.postmanModeBtnActive : ''}`}
            onClick={() => setInputMode('upload')}
          >
            Upload JSON
          </button>
        </div>

        {inputMode === 'url' && (
          <div className={styles.urlRow}>
            <div className={styles.urlInputWrap}>
              <Link size={14} className={styles.urlIcon} />
              <input
                className={styles.urlInput}
                placeholder="https://example.com/postman-collection.json"
                value={postmanUrl}
                onChange={(e) => setPostmanUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleParse()}
              />
            </div>
            <Button onClick={handleParse} loading={loading} size="md">
              <FileCode2 size={14} /> Parse
            </Button>
          </div>
        )}

        {inputMode === 'paste' && (
          <>
            <textarea
              className={styles.postmanJsonInput}
              placeholder='{"info":{"name":"My Collection"},"item":[...]}'
              value={postmanContent}
              onChange={(e) => setPostmanContent(e.target.value)}
            />
            <div className={styles.postmanActionRow}>
              <Button onClick={handleParse} loading={loading} size="md">
                <FileCode2 size={14} /> Parse
              </Button>
            </div>
          </>
        )}

        {inputMode === 'upload' && (
          <>
            <div className={styles.postmanUploadWrap}>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className={styles.postmanFileInput}
              />
              <p className={styles.postmanUploadHint}>
                {uploadFileName ? `Loaded file: ${uploadFileName}` : 'Choose a Postman collection JSON file'}
              </p>
            </div>
            <div className={styles.postmanActionRow}>
              <Button onClick={handleParse} loading={loading} size="md" disabled={!postmanContent.trim()}>
                <FileCode2 size={14} /> Parse
              </Button>
            </div>
          </>
        )}
      </div>

      {parsed && (
        <div className={styles.card}>
          <div className={styles.parsedHeader}>
            <div>
              <h2 className={styles.parsedTitle}>{parsed.title}</h2>
              <p className={styles.parsedMeta}>
                Version {parsed.version} - {parsed.baseUrl || 'No baseUrl variable found'} - {parsed.total} endpoints found
              </p>
            </div>
            <div className={styles.parsedActions}>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selected.length === parsed.endpoints.length ? 'Deselect all' : 'Select all'}
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                loading={importing}
                disabled={!selected.length}
                variant="primary"
              >
                <><Database size={13} /> Import {selected.length > 0 ? `(${selected.length})` : ''}</>
              </Button>
            </div>
          </div>

          <div className={styles.endpointList}>
            {parsed.endpoints.map((ep, i) => {
              const rowKey = endpointSelectionKey(i);
              const isSelected = selected.includes(rowKey);
              return (
                <div
                  key={rowKey}
                  className={`${styles.endpointRow} ${isSelected ? styles.endpointSelected : ''}`}
                  onClick={() => toggleSelect(rowKey)}
                >
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isSelected}
                    onChange={() => toggleSelect(rowKey)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span
                    className={styles.epMethod}
                    style={{ color: METHOD_COLORS[ep.method] || '#6b7280' }}
                  >
                    {ep.method}
                  </span>
                  <span className={styles.epPath}>{ep.path}</span>
                  {ep.summary && <span className={styles.epSummary}>{ep.summary}</span>}
                  {ep.schema && (
                    <Badge variant="purple" className={styles.schemaBadge}>body</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


