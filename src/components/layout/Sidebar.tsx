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

interface SidebarProps {
  /** Whether the mobile drawer is open. Ignored on desktop, where the sidebar is always shown. */
  mobileOpen?: boolean;
  /** Called when a link is tapped or the backdrop is clicked, to close the mobile drawer. */
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop — mobile only, shown while the drawer is open. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 transform flex-col border-r border-white/5 bg-navy text-slate-300 transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <Logo size={28} onDark />
            <span className="text-lg font-semibold tracking-tight">
              <span className="text-white">Job</span>{' '}
              <span className="text-success">Master</span>
            </span>
          </div>
          {/* Close button — mobile only. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xl leading-none text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
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
        <div className="px-5 py-4 text-xs text-white/40">v3.2</div>
      </aside>
    </>
  );
}
