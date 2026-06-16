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
    <aside className="flex w-60 shrink-0 flex-col border-r border-white/5 bg-navy text-slate-300">
      <div className="flex items-center gap-2 px-5 py-5">
        <Logo size={28} onDark />
        <span className="text-lg font-semibold tracking-tight">
          <span className="text-white">Job</span>{' '}
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
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.soon && (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-300">
                Soon
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-xs text-white/40">v3.0</div>
    </aside>
  );
}
