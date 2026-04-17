import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Play, FileText, Clock, ChevronDown } from 'lucide-react';
import { configsApi } from '../services/api';
import { Button, Modal, Input, Select, EmptyState, SectionHeader, Spinner, Card } from '../components/ui';
import { useInlinePageStyles } from '../theme/useInlinePageStyles';


const styles = new Proxy({}, { get: (_, key) => String(key) });
const DASHBOARD_PAGE_STYLES = String.raw`.page {
  padding: 28px 32px;
  /* max-width: 1400px; */
}

.pageHeader {
  margin-bottom: 28px;
}

.pageTitle {
  font-size: var(--type-h5-font-size);
  font-weight: 700;
  line-height: var(--type-h5-line-height);
  letter-spacing: var(--type-h5-letter-spacing);
  color: var(--text-primary);
}

.pageSubtitle {
  font-size: var(--type-body2-font-size);
  font-weight: var(--type-body2-font-weight);
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  color: var(--text-muted);
  margin-top: 3px;
}

.section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 20px 24px;
}

.sectionActions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.searchWrap {
  width: min(280px, 42vw);
  min-width: 180px;
}

.filterWrap {
  width: 150px;
}

.sortWrap {
  width: 170px;
}

.dropdown {
  position: relative;
  width: 100%;
}

.dropdownTrigger {
  width: 100%;
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text-secondary);
  border-radius: 10px;
  height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
}

.dropdownTrigger:hover {
  border-color: #c5cad5;
  color: var(--text-primary);
}

.dropdownTriggerOpen {
  border-color: var(--purple-500);
  color: var(--text-primary);
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.16);
}

.dropdownValue {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font-size: var(--type-body2-font-size);
  font-weight: 500;
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
}

.dropdownChevron {
  color: var(--text-muted);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.dropdownChevronOpen {
  transform: rotate(180deg);
}

.dropdownMenu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 30;
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
  transform-origin: top center;
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.dropdownMenuOpen {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.dropdownOption {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  color: var(--text-secondary);
  font-size: var(--type-body2-font-size);
  font-weight: var(--type-body2-font-weight);
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}

.dropdownOption:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dropdownOptionActive {
  background: rgba(139, 92, 246, 0.14);
  color: var(--text-primary);
  font-weight: 600;
}

.loadingCenter {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.configCard {
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
  border-radius: var(--radius-lg);
  padding: 14px 16px;
}

.configCard:hover {
  box-shadow: var(--shadow-md);
  border-color: #d1d5db;
}

.cardTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  min-width: 0;
}

.configName {
  font-size: var(--type-subtitle1-font-size);
  font-weight: 600;
  line-height: var(--type-subtitle1-line-height);
  letter-spacing: var(--type-subtitle1-letter-spacing);
  color: var(--text-primary);
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.deleteBtn {
  border: 1px solid var(--red-500);
  background: transparent;
  color: var(--red-500);
  border-radius: var(--radius-sm);
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.deleteBtn:hover { background: #fff1f1; }

.cardMeta {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
  min-width: 0;
}

.method {
  font-size: var(--type-subtitle2-font-size);
  font-weight: 700;
  line-height: var(--type-subtitle2-line-height);
  letter-spacing: var(--type-subtitle2-letter-spacing);
  flex-shrink: 0;
  white-space: nowrap;
}

.url {
  font-size: var(--type-body2-font-size);
  font-weight: var(--type-body2-font-weight);
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  color: var(--text-muted);
  flex: 1;
  min-width: 0;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lastRun {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--type-caption-font-size);
  font-weight: var(--type-caption-font-weight);
  line-height: var(--type-caption-line-height);
  letter-spacing: var(--type-caption-letter-spacing);
  color: var(--text-muted);
  margin-top: 4px;
  min-width: 0;
}

/* Form */
.form { display: flex; flex-direction: column; gap: 14px; }
.row  { display: flex; align-items: flex-end; gap: 10px; }
.modalActions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }

/* Delete confirmation snackbar */
.deleteConfirmToast {
  min-width: 320px;
  max-width: min(92vw, 420px);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 12px 14px;
}

.deleteConfirmToastIn {
  animation: deleteConfirmToastIn 0.18s ease-out;
}

.deleteConfirmToastOut {
  animation: deleteConfirmToastOut 0.16s ease-in forwards;
}

.deleteConfirmTitle {
  font-size: var(--type-subtitle2-font-size);
  font-weight: 700;
  line-height: var(--type-subtitle2-line-height);
  letter-spacing: var(--type-subtitle2-letter-spacing);
  color: var(--text-primary);
}

.deleteConfirmText {
  font-size: var(--type-body2-font-size);
  font-weight: var(--type-body2-font-weight);
  line-height: var(--type-body2-line-height);
  letter-spacing: var(--type-body2-letter-spacing);
  color: var(--text-secondary);
  margin-top: 4px;
  word-break: break-word;
}

.deleteConfirmActions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.deleteConfirmBtn {
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

@media (max-width: 900px) {
  .page {
    padding: 18px 14px;
  }

  .section {
    padding: 14px;
  }

  .sectionActions {
    width: 100%;
    justify-content: flex-start;
  }

  .searchWrap,
  .filterWrap,
  .sortWrap {
    width: 100%;
    min-width: 0;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}

.deleteConfirmBtnCancel {
  border-color: var(--border);
  color: var(--text-secondary);
  background: transparent;
}

.deleteConfirmBtnCancel:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.deleteConfirmBtnDelete {
  border-color: var(--red-500);
  color: #fff;
  background: var(--red-500);
}

.deleteConfirmBtnDelete:hover {
  background: var(--red-600);
}

@keyframes deleteConfirmToastIn {
  from { opacity: 0; transform: translateY(-8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes deleteConfirmToastOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(-6px) scale(0.98); }
}
`;

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const METHOD_FILTER_OPTIONS = [{ value: 'ALL', label: 'All Methods' }, ...METHODS.map((m) => ({ value: m, label: m }))];
const METHOD_COLORS = { GET: '#3b82f6', POST: '#22c55e', PUT: '#f59e0b', PATCH: '#8b5cf6', DELETE: '#ef4444' };
const SORT_OPTIONS = [
  { value: 'updated_desc', label: 'Updated (Newest)' },
  { value: 'updated_asc', label: 'Updated (Oldest)' },
  { value: 'created_desc', label: 'Created (Newest)' },
  { value: 'created_asc', label: 'Created (Oldest)' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
];

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleString();
}

export default function DashboardPage() {
  useInlinePageStyles('dashboard-page-inline-styles', DASHBOARD_PAGE_STYLES);
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', method: 'POST', url: '' });
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('updated_desc');
  const [openDropdown, setOpenDropdown] = useState(null);
  const methodDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  useEffect(() => { fetchConfigs(); }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const insideMethod = methodDropdownRef.current?.contains(event.target);
      const insideSort = sortDropdownRef.current?.contains(event.target);
      if (!insideMethod && !insideSort) setOpenDropdown(null);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpenDropdown(null);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await configsApi.getAll();
      setConfigs(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.url.trim())  e.url  = 'URL is required';
    else {
      try { new URL(form.url); }
      catch { e.url = 'Enter a valid URL (https://...)'; }
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const cfg = await configsApi.create(form);
      toast.success('API config created');
      setShowModal(false);
      setForm({ name: '', method: 'POST', url: '' });
      navigate(`/config/${cfg._id}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteConfig = async (id) => {
    try {
      await configsApi.remove(id);
      setConfigs((prev) => prev.filter((c) => c._id !== id));
      toast.success('Deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = (e, id, name) => {
    e.stopPropagation();
    toast.custom(
      (t) => (
        <div className={`${styles.deleteConfirmToast} ${t.visible ? styles.deleteConfirmToastIn : styles.deleteConfirmToastOut}`}>
          <div className={styles.deleteConfirmTitle}>Delete API config?</div>
          <div className={styles.deleteConfirmText}>
            {`"${name}" and all its payloads will be deleted permanently.`}
          </div>
          <div className={styles.deleteConfirmActions}>
            <button
              className={`${styles.deleteConfirmBtn} ${styles.deleteConfirmBtnCancel}`}
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
            <button
              className={`${styles.deleteConfirmBtn} ${styles.deleteConfirmBtnDelete}`}
              onClick={() => {
                toast.dismiss(t.id);
                void deleteConfig(id);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { id: `delete-config-${id}`, duration: 9000, position: 'top-center' }
    );
  };

  const methodFilterLabel = METHOD_FILTER_OPTIONS.find((option) => option.value === methodFilter)?.label ?? 'All Methods';
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? 'Sort';
  const toggleDropdown = (dropdown) => {
    setOpenDropdown((prev) => (prev === dropdown ? null : dropdown));
  };

  const hasActiveFilters = Boolean(searchTerm.trim()) || methodFilter !== 'ALL' || sortBy !== 'updated_desc';

  const visibleConfigs = (() => {
    const q = searchTerm.trim().toLowerCase();

    const filtered = configs.filter((cfg) => {
      if (methodFilter !== 'ALL' && cfg.method !== methodFilter) return false;
      if (!q) return true;

      return [cfg.name, cfg.url, cfg.method]
        .map((v) => String(v ?? '').toLowerCase())
        .some((v) => v.includes(q));
    });

    const toTs = (v) => {
      const ts = new Date(v).getTime();
      return Number.isNaN(ts) ? 0 : ts;
    };

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'updated_asc':
          return toTs(a.updatedAt || a.createdAt) - toTs(b.updatedAt || b.createdAt);
        case 'created_desc':
          return toTs(b.createdAt || b.updatedAt) - toTs(a.createdAt || a.updatedAt);
        case 'created_asc':
          return toTs(a.createdAt || a.updatedAt) - toTs(b.createdAt || b.updatedAt);
        case 'name_asc':
          return String(a.name ?? '').localeCompare(String(b.name ?? ''));
        case 'name_desc':
          return String(b.name ?? '').localeCompare(String(a.name ?? ''));
        case 'updated_desc':
        default:
          return toTs(b.updatedAt || b.createdAt) - toTs(a.updatedAt || a.createdAt);
      }
    });
  })();

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>API Flow</h1>
          <p className={styles.pageSubtitle}>Create and test APIs with multiple payloads, then generate pass/fail reports.</p>
        </div>
      </div>

      {/* Section */}
      <div className={styles.section}>
        <SectionHeader
          title="API Testing"
          subtitle="Create APIs, test multiple payloads, generate pass/fail reports."
          action={
            <div className={styles.sectionActions}>
              <div className={styles.searchWrap}>
                <Input
                  placeholder="Search APIs by name, URL, method"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.filterWrap}>
                <div className={styles.dropdown} ref={methodDropdownRef}>
                  <button
                    type="button"
                    className={`${styles.dropdownTrigger} ${openDropdown === 'method' ? styles.dropdownTriggerOpen : ''}`}
                    onClick={() => toggleDropdown('method')}
                    aria-haspopup="listbox"
                    aria-expanded={openDropdown === 'method'}
                  >
                    <span className={styles.dropdownValue}>{methodFilterLabel}</span>
                    <ChevronDown
                      size={16}
                      className={`${styles.dropdownChevron} ${openDropdown === 'method' ? styles.dropdownChevronOpen : ''}`}
                    />
                  </button>
                  <div className={`${styles.dropdownMenu} ${openDropdown === 'method' ? styles.dropdownMenuOpen : ''}`} role="listbox">
                    {METHOD_FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.dropdownOption} ${methodFilter === option.value ? styles.dropdownOptionActive : ''}`}
                        onClick={() => {
                          setMethodFilter(option.value);
                          setOpenDropdown(null);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.sortWrap}>
                <div className={styles.dropdown} ref={sortDropdownRef}>
                  <button
                    type="button"
                    className={`${styles.dropdownTrigger} ${openDropdown === 'sort' ? styles.dropdownTriggerOpen : ''}`}
                    onClick={() => toggleDropdown('sort')}
                    aria-haspopup="listbox"
                    aria-expanded={openDropdown === 'sort'}
                  >
                    <span className={styles.dropdownValue}>{sortLabel}</span>
                    <ChevronDown
                      size={16}
                      className={`${styles.dropdownChevron} ${openDropdown === 'sort' ? styles.dropdownChevronOpen : ''}`}
                    />
                  </button>
                  <div className={`${styles.dropdownMenu} ${openDropdown === 'sort' ? styles.dropdownMenuOpen : ''}`} role="listbox">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.dropdownOption} ${sortBy === option.value ? styles.dropdownOptionActive : ''}`}
                        onClick={() => {
                          setSortBy(option.value);
                          setOpenDropdown(null);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={() => setShowModal(true)} size="md">
                <Plus size={15} /> Create API Config
              </Button>
            </div>
          }
        />

        {loading ? (
          <div className={styles.loadingCenter}><Spinner /></div>
        ) : configs.length === 0 ? (
          <EmptyState
            icon={Play}
            title="No API configs yet"
            description="Create your first API config to start testing with AI-generated edge cases."
            action={
              <Button onClick={() => setShowModal(true)} size="sm">
                <Plus size={13} /> Create API Config
              </Button>
            }
          />
        ) : visibleConfigs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No matching API configs"
            description="Try changing search text, method filter, or sort options."
            action={
              hasActiveFilters ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setMethodFilter('ALL');
                    setSortBy('updated_desc');
                  }}
                >
                  Clear Filters
                </Button>
              ) : null
            }
          />
        ) : (
          <div className={styles.grid}>
            {visibleConfigs.map((cfg) => (
              <Card key={cfg._id} className={styles.configCard} onClick={() => navigate(`/config/${cfg._id}`)}>
                <div className={styles.cardTop}>
                  <span className={styles.configName}>{cfg.name}</span>
                  <button className={styles.deleteBtn} onClick={(e) => handleDelete(e, cfg._id, cfg.name)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.method} style={{ color: METHOD_COLORS[cfg.method] || '#6b7280' }}>
                    {cfg.method}
                  </span>
                  <span className={styles.url}>{cfg.url}</span>
                </div>
                {cfg.lastRun && (
                  <div className={styles.lastRun}>
                    <Clock size={11} />
                    Updated: {formatDate(cfg.updatedAt)}
                  </div>
                )}
                {!cfg.lastRun && (
                  <div className={styles.lastRun}>
                    <Clock size={11} />
                    Updated: {formatDate(cfg.updatedAt)}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create API Config">
        <div className={styles.form}>
          <Input
            label="Config Name"
            placeholder="e.g. User Login API"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            error={errors.name}
          />
          <div className={styles.row}>
            <Select
              label="Method"
              value={form.method}
              onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}
              style={{ width: 110 }}
            >
              {METHODS.map((m) => <option key={m}>{m}</option>)}
            </Select>
            <div style={{ flex: 1 }}>
              <Input
                label="URL"
                placeholder="https://api.example.com/endpoint"
                value={form.url}
                onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                error={errors.url}
              />
            </div>
          </div>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
