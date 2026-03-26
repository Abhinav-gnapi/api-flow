import { useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, Link, Upload, CheckCircle2, ArrowRight, Database } from 'lucide-react';
import { swaggerApi } from '../services/api';
import { Button, SectionHeader, Spinner, Badge } from '../components/ui';
import styles from './SwaggerPage.module.css';

const METHOD_COLORS = {
  GET: '#3b82f6', POST: '#22c55e', PUT: '#f59e0b',
  PATCH: '#8b5cf6', DELETE: '#ef4444',
};

export default function SwaggerPage() {
  const [swaggerUrl, setSwaggerUrl]     = useState('');
  const [parsed, setParsed]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [importing, setImporting]       = useState(false);
  const [selected, setSelected]         = useState([]);
  const [imported, setImported]         = useState(false);

  const handleParse = async () => {
    if (!swaggerUrl.trim()) return toast.error('Enter a Swagger URL');
    setLoading(true);
    setParsed(null);
    setSelected([]);
    setImported(false);
    try {
      const data = await swaggerApi.parse({ url: swaggerUrl });
      setParsed(data);
      toast.success(`Found ${data.total} endpoints`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (path_method) => {
    setSelected((prev) =>
      prev.includes(path_method)
        ? prev.filter((x) => x !== path_method)
        : [...prev, path_method]
    );
  };

  const toggleAll = () => {
    if (!parsed) return;
    const allKeys = parsed.endpoints.map((e) => `${e.method}::${e.path}`);
    setSelected(selected.length === allKeys.length ? [] : allKeys);
  };

  const handleImport = async () => {
    if (!parsed || !selected.length) return toast.error('Select at least one endpoint');
    const endpoints = parsed.endpoints.filter((e) =>
      selected.includes(`${e.method}::${e.path}`)
    );
    setImporting(true);
    try {
      const res = await swaggerApi.import({ endpoints, baseUrl: parsed.baseUrl });
      toast.success(`Imported ${res.created} API configs`);
      setImported(true);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Swagger / OpenAPI Import</h1>
        <p className={styles.pageSubtitle}>
          Parse a Swagger URL or file and auto-import all endpoints as API configs.
        </p>
      </div>

      {/* URL input section */}
      <div className={styles.card}>
        <SectionHeader
          title="Parse Swagger URL"
          subtitle="Enter a public Swagger / OpenAPI spec URL (JSON or YAML)."
        />
        <div className={styles.urlRow}>
          <div className={styles.urlInputWrap}>
            <Link size={14} className={styles.urlIcon} />
            <input
              className={styles.urlInput}
              placeholder="https://petstore.swagger.io/v2/swagger.json"
              value={swaggerUrl}
              onChange={(e) => setSwaggerUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleParse()}
            />
          </div>
          <Button onClick={handleParse} loading={loading} size="md">
            <BookOpen size={14} /> Parse
          </Button>
        </div>

        {/* Example hint */}
        <p className={styles.hint}>
          Try: <button className={styles.hintLink} onClick={() => setSwaggerUrl('https://petstore.swagger.io/v2/swagger.json')}>
            https://petstore.swagger.io/v2/swagger.json
          </button>
        </p>
      </div>

      {/* Parsed results */}
      {parsed && (
        <div className={styles.card}>
          <div className={styles.parsedHeader}>
            <div>
              <h2 className={styles.parsedTitle}>{parsed.title}</h2>
              <p className={styles.parsedMeta}>
                Version {parsed.version} · {parsed.baseUrl} · {parsed.total} endpoints found
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
                disabled={!selected.length || imported}
                variant={imported ? 'success' : 'primary'}
              >
                {imported
                  ? <><CheckCircle2 size={13} /> Imported</>
                  : <><Database size={13} /> Import {selected.length > 0 ? `(${selected.length})` : ''}</>
                }
              </Button>
            </div>
          </div>

          {/* Endpoints table */}
          <div className={styles.endpointList}>
            {parsed.endpoints.map((ep, i) => {
              const key = `${ep.method}::${ep.path}`;
              const isSelected = selected.includes(key);
              return (
                <div
                  key={i}
                  className={`${styles.endpointRow} ${isSelected ? styles.endpointSelected : ''}`}
                  onClick={() => toggleSelect(key)}
                >
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isSelected}
                    onChange={() => toggleSelect(key)}
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
                    <Badge variant="purple" className={styles.schemaBadge}>schema</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {imported && (
        <div className={styles.successBanner}>
          <CheckCircle2 size={18} className={styles.successIcon} />
          <div>
            <p className={styles.successTitle}>Import successful!</p>
            <p className={styles.successDesc}>
              Your API configs are ready. Go to the Dashboard to start testing with AI-generated edge cases.
            </p>
          </div>
          <Button size="sm" onClick={() => window.location.href = '/'}>
            Go to Dashboard <ArrowRight size={13} />
          </Button>
        </div>
      )}
    </div>
  );
}
