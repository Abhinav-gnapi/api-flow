import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { reportsApi } from '../services/api';
import { Button, StatusBadge, Spinner } from '../components/ui';
import styles from './ReportPage.module.css';

function formatDate(d) {
  return d ? new Date(d).toLocaleString() : '—';
}

function ResultRow({ result, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.resultRow}>
      <div className={styles.resultRowMain} onClick={() => setExpanded((v) => !v)}>
        <div className={styles.resultLeft}>
          <span className={styles.resultName}>{result.payloadName}</span>
          <span className={styles.resultMeta}>
            HTTP {result.statusCode} {result.statusText} · {result.latencyMs}ms
          </span>
        </div>
        <div className={styles.resultRight}>
          <StatusBadge passed={result.passed} />
          <button className={styles.expandBtn}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.resultDetail}>
          <div className={styles.detailGrid}>
            <div className={styles.detailPane}>
              <div className={styles.detailLabel}>PAYLOAD SENT</div>
              <pre className={styles.jsonBlock}>
                {JSON.stringify(result.payloadBody, null, 2)}
              </pre>
            </div>
            <div className={styles.detailPane}>
              <div className={styles.detailLabel}>RESPONSE RECEIVED</div>
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
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReport(); }, [id]);

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
    window.print();
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
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>Report · {report.configName}</h1>
            <p className={styles.subtitle}>Last run: {formatDate(report.runAt)}</p>
          </div>
        </div>
        <div className={styles.topbarRight}>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download size={13} /> Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/config/${report.configId}`)}>
            <ArrowLeft size={13} /> Back
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
              <ResultRow key={i} result={result} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
