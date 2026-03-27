import { Outlet, NavLink } from 'react-router-dom';
import { Zap, FileCode2, GitBranch, LayoutDashboard, BookOpen, BarChart2 } from 'lucide-react';
import styles from './Layout.module.css';

const navItems = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/execution', icon: BarChart2,       label: 'Execution Results' },
  { to: '/swagger', icon: BookOpen,        label: 'Swagger Import' },
  { to: '/postman', icon: FileCode2,       label: 'Postman Import' },
  { to: '/flows',   icon: GitBranch,       label: 'Flow Designer' },
];

export default function Layout() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}><Zap size={18} strokeWidth={2.5} /></div>
          <span className={styles.logoText}>API Flow</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
