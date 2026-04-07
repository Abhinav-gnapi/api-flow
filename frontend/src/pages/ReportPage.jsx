import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { reportsApi } from '../services/api';
import { Button, StatusBadge, Spinner } from '../components/ui';
import { useInlinePageStyles } from '../theme/useInlinePageStyles';
import { PreviousPageArrow } from '../theme/components/PreviousPageArrow';

const styles = new Proxy({}, { get: (_, key) => String(key) });
const REPORT_PAGE_STYLES = String.raw`.page {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}

.center {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4.6px 10px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
}

.topbarLeft { display: flex; align-items: center; gap: 12px; }
.topbarRight { display: flex; gap: 8px; }
.backBtn {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
}
.backBtn:hover { background: transparent; }

.title {
  font-size: var(--type-h6-font-size);
  font-weight: var(--type-h6-font-weight);
  line-height: var(--type-h6-line-height);
  letter-spacing: var(--type-h6-letter-spacing);
  color: var(--text-primary);
}

.subtitle {
  font-size: var(--type-body2-font-size);
  font-weight: var(--type-body2-font-weight);
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  color: var(--text-muted);
  margin-top: 2px;
}

.content {
  padding: 24px 28px;
  max-width: 1100px;
  width: 100%;
}

/* Summary bar */
.summaryBar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
}

.summaryItem {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summaryLabel {
  font-size: var(--type-body2-font-size);
  font-weight: var(--type-body2-font-weight);
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  color: var(--text-secondary);
}

.summaryValue {
  font-size: var(--type-subtitle2-font-size);
  font-weight: var(--type-subtitle2-font-weight);
  line-height: var(--type-subtitle2-line-height);
  letter-spacing: var(--type-subtitle2-letter-spacing);
  color: var(--text-primary);
}

.summaryDivider {
  width: 1px;
  height: 20px;
  background: var(--border);
}

.summaryBadge {
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  border-radius: var(--radius-full);
  font-size: var(--type-subtitle2-font-size);
  font-weight: var(--type-subtitle2-font-weight);
  line-height: var(--type-subtitle2-line-height);
  letter-spacing: var(--type-subtitle2-letter-spacing);
}

.passBadge { background: var(--green-500); color: #fff; }
.failBadge { background: var(--red-500);   color: #fff; }

/* Progress */
.progressSection {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.progressBar {
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: var(--green-500);
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.progressLabel {
  font-size: var(--type-caption-font-size);
  font-weight: var(--type-subtitle2-font-weight);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-secondary);
  white-space: nowrap;
}

/* Results section */
.resultsSection {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.resultsHeader {
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border);
}

.resultsTitle {
  font-size: var(--type-subtitle1-font-size);
  font-weight: var(--type-subtitle1-font-weight);
  line-height: var(--type-subtitle1-line-height);
  letter-spacing: var(--type-subtitle1-letter-spacing);
  color: var(--text-primary);
}

.resultsSubtitle {
  font-size: var(--type-caption-font-size);
  font-weight: var(--type-caption-font-weight);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-muted);
  margin-top: 2px;
}

.resultsList { }

/* Result row */
.resultRow {
  border-bottom: 1px solid var(--border);
}
.resultRow:last-child { border-bottom: none; }

.resultRowMain {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.12s;
}
.resultRowMain:hover { background: var(--bg-hover); }

.resultLeft { display: flex; flex-direction: column; gap: 2px; }

.resultName {
  font-size: var(--type-body2-font-size);
  font-weight: var(--type-subtitle2-font-weight);
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  color: var(--text-primary);
}

.resultMeta {
  font-size: var(--type-caption-font-size);
  font-weight: var(--type-caption-font-weight);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.resultRight {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expandBtn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
}

/* Expanded detail */
.resultDetail {
  padding: 0 20px 16px;
  background: var(--bg-code);
  border-top: 1px solid var(--border);
}

.detailGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 12px;
}

.detailPane { display: flex; flex-direction: column; gap: 6px; }

.detailLabel {
  font-size: var(--type-overline-font-size);
  font-weight: var(--type-overline-font-weight);
  line-height: var(--type-overline-line-height);
  letter-spacing: var(--type-overline-letter-spacing);
  color: var(--text-muted);
  text-transform: var(--type-overline-text-transform);
}

.jsonBlock {
  font-family: var(--font-mono);
  font-size: var(--type-caption-font-size);
  font-weight: var(--type-caption-font-weight);
  line-height: 1.6;
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 220px;
  overflow-y: auto;
}

/* Print styles */
@media print {
  .page {
    min-height: auto;
    background: #fff !important;
  }

  .topbar {
    padding: 0 0 10px;
    margin-bottom: 10px;
    background: #fff;
    border-bottom: 1px solid #d1d5db;
  }

  .topbarRight { display: none; }
  .expandBtn   { display: none; }

  .content {
    max-width: none;
    padding: 0;
  }

  .summaryBar,
  .resultsSection {
    box-shadow: none;
  }

  .passBadge {
    background: var(--green-500) !important;
    color: #fff !important;
  }

  .failBadge {
    background: var(--red-500) !important;
    color: #fff !important;
  }

  .resultRow {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .resultDetail { display: block !important; }

  .jsonBlock {
    max-height: none !important;
    overflow: visible !important;
  }
}
`;

function formatDate(d) {
  return d ? new Date(d).toLocaleString() : '--';
}

function ResultRow({ result, isPrinting }) {
  const [expanded, setExpanded] = useState(false);
  const showDetail = expanded || isPrinting;

  return (
    <div className={styles.resultRow}>
      <div className={styles.resultRowMain} onClick={() => setExpanded((v) => !v)}>
        <div className={styles.resultLeft}>
          <span className={styles.resultName}>{result.payloadName}</span>
          <span className={styles.resultMeta}>
            HTTP {result.statusCode} {result.statusText} - {result.latencyMs}ms
          </span>
        </div>
        <div className={styles.resultRight}>
          <StatusBadge passed={result.passed} />
          <button className={styles.expandBtn}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {showDetail && (
        <div className={styles.resultDetail}>
          <div className={styles.detailGrid}>
            <div className={styles.detailPane}>
              <div className={styles.detailLabel}>Payload Sent</div>
              <pre className={styles.jsonBlock}>
                {JSON.stringify(result.payloadBody, null, 2)}
              </pre>
            </div>
            <div className={styles.detailPane}>
              <div className={styles.detailLabel}>Response Received</div>
              <pre className={styles.jsonBlock}>
                {result.error
                  ? result.error
                  : JSON.stringify(result.response, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportPage() {
  useInlinePageStyles('report-page-inline-styles', REPORT_PAGE_STYLES);
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => { fetchReport(); }, [id]);

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const fetchReport = async () => {
    try {
      const data = await reportsApi.getOne(id);
      setReport(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    setIsPrinting(true);
    window.requestAnimationFrame(() => window.print());
  };

  if (loading) return <div className={styles.center}><Spinner size={28} /></div>;
  if (!report) return <div className={styles.center}><p>Report not found.</p></div>;

  const passRate = report.totalPayloads > 0
    ? Math.round((report.passed / report.totalPayloads) * 100)
    : 0;

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button className={styles.backBtn} onClick={() => navigate(`/config/${report.configId}`)}>
            <PreviousPageArrow width={24} height={24} />
          </button>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>Report - {report.configName}</h1>
            <p className={styles.subtitle}>Last run: {formatDate(report.runAt)}</p>
          </div>
        </div>
        <div className={styles.topbarRight}>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download size={13} /> Download PDF
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        {/* Summary bar */}
        <div className={styles.summaryBar}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total payloads</span>
            <span className={styles.summaryValue}>{report.totalPayloads}</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Executed</span>
            <span className={styles.summaryValue}>{report.executed}</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={`${styles.summaryBadge} ${styles.passBadge}`}>
            Passed: {report.passed}
          </div>
          <div className={`${styles.summaryBadge} ${styles.failBadge}`}>
            Failed: {report.failed}
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${passRate}%` }}
            />
          </div>
          <span className={styles.progressLabel}>{passRate}% pass rate</span>
        </div>

        {/* Results list */}
        <div className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>Payload results</h2>
            <p className={styles.resultsSubtitle}>
              Pass/fail is based on HTTP status (2xx = pass). Network errors count as fail.
            </p>
          </div>

          <div className={styles.resultsList}>
            {report.results.map((result, i) => (
              <ResultRow key={i} result={result} isPrinting={isPrinting} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

