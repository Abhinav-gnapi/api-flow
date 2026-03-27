import { useState } from 'react';
import toast from 'react-hot-toast';
import { FileCode2, Link, CheckCircle2, ArrowRight, Database } from 'lucide-react';
import { postmanApi } from '../services/api';
import { Button, SectionHeader, Badge } from '../components/ui';
import styles from './SwaggerPage.module.css';

const METHOD_COLORS = {
  GET: '#3b82f6',
  POST: '#22c55e',
  PUT: '#f59e0b',
  PATCH: '#8b5cf6',
  DELETE: '#ef4444',
};

export default function PostmanPage() {
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
