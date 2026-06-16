import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  soon?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/jobs', label: 'Jobs', icon: '📁' },
  { to: '/planner', label: 'Planner', icon: '📅' },
  { to: '/calendar', label: 'Calendar', icon: '🗓️' },
  { to: '/clients', label: 'Clients', icon: '👥' },
  { to: '/invoices', label: 'Invoices', icon: '💷' },
  { to: '/payments', label: 'Payments', icon: '✅' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <Logo size={28} />
        <span className="text-lg font-semibold tracking-tight">
          <span className="text-navy">Job</span>{' '}
          <span className="text-success">Master</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.soon && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-400">
                Soon
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-xs text-slate-400">v3.0</div>
    </aside>
  );
}
