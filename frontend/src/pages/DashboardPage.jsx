import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Trash2, Play, FileText, Clock } from 'lucide-react';
import { configsApi } from '../services/api';
import { Button, Modal, Input, Select, EmptyState, SectionHeader, Spinner, Card } from '../components/ui';
import styles from './DashboardPage.module.css';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const METHOD_COLORS = { GET: '#3b82f6', POST: '#22c55e', PUT: '#f59e0b', PATCH: '#8b5cf6', DELETE: '#ef4444' };

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleString();
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', method: 'POST', url: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchConfigs(); }, []);

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
            <Button onClick={() => setShowModal(true)} size="md">
              <Plus size={15} /> Create API
            </Button>
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
                <Plus size={13} /> Create API
              </Button>
            }
          />
        ) : (
          <div className={styles.grid}>
            {configs.map((cfg) => (
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
