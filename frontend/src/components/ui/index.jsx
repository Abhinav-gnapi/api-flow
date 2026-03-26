import styles from './UI.module.css';
import { clsx } from 'clsx';
import { X, Loader2 } from 'lucide-react';

/* ── Button ─────────────────────────────────────────────────── */
export function Button({ children, variant = 'primary', size = 'md', loading, className, ...props }) {
  return (
    <button
      className={clsx(styles.btn, styles[`btn-${variant}`], styles[`btn-${size}`], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={14} className={styles.spin} />}
      {children}
    </button>
  );
}

/* ── Badge ──────────────────────────────────────────────────── */
export function Badge({ children, variant = 'default', className }) {
  return (
    <span className={clsx(styles.badge, styles[`badge-${variant}`], className)}>
      {children}
    </span>
  );
}

/* ── StatusBadge (PASS / FAIL / pending) ────────────────────── */
export function StatusBadge({ passed, pending, statusCode }) {
  if (pending) return <span className={clsx(styles.badge, styles['badge-pending'])}>—</span>;
  return passed
    ? <span className={clsx(styles.badge, styles['badge-pass'])}>PASS</span>
    : <span className={clsx(styles.badge, styles['badge-fail'])}>FAIL</span>;
}

/* ── Card ───────────────────────────────────────────────────── */
export function Card({ children, className, onClick, selected }) {
  return (
    <div
      className={clsx(styles.card, selected && styles.cardSelected, onClick && styles.cardClickable, className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/* ── Modal ──────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title}</span>
          <button className={styles.modalClose} onClick={onClose}><X size={16} /></button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

/* ── Input ──────────────────────────────────────────────────── */
export function Input({ label, error, className, ...props }) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={clsx(styles.input, error && styles.inputError, className)} {...props} />
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
}

/* ── Select ─────────────────────────────────────────────────── */
export function Select({ label, className, children, ...props }) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <select className={clsx(styles.select, className)} {...props}>
        {children}
      </select>
    </div>
  );
}

/* ── Spinner ────────────────────────────────────────────────── */
export function Spinner({ size = 20 }) {
  return <Loader2 size={size} className={styles.spin} color="var(--purple-500)" />;
}

/* ── EmptyState ─────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className={styles.empty}>
      {Icon && <div className={styles.emptyIcon}><Icon size={28} strokeWidth={1.5} /></div>}
      <p className={styles.emptyTitle}>{title}</p>
      {description && <p className={styles.emptyDesc}>{description}</p>}
      {action}
    </div>
  );
}

/* ── SectionHeader ──────────────────────────────────────────── */
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className={styles.sectionHeader}>
      <div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
