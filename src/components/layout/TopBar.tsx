import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RemindersBell } from './RemindersBell';
import { CommandPalette, isMacLike } from './CommandPalette';
import { useSettings } from '../../hooks/useSettings';
import { getTheme, toggleTheme, type Theme } from '../../lib/theme';

/** Close a popover when clicking outside of the given container. */
function useClickOutside(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open, onClose]);
  return ref;
}

const menuItemCls =
  'block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50';

function NewMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <div ref={ref} className="relative flex">
      <button
        type="button"
        onClick={() => go('/jobs/new')}
        className="rounded-l-lg border border-r-0 border-transparent bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        + New Job
      </button>
      <button
        type="button"
        aria-label="More create options"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-r-lg border border-transparent border-l-white/30 bg-brand-600 px-2 text-xs text-white transition hover:bg-brand-700"
      >
        ▾
      </button>
      {open && (
        <div className="animate-panel absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-surface py-1 shadow-lg">
          <button type="button" className={menuItemCls} onClick={() => go('/jobs/new')}>
            New job
          </button>
          <button
            type="button"
            className={menuItemCls}
            onClick={() => go('/clients?new=1')}
          >
            New client
          </button>
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  return (
    <button
      type="button"
      onClick={() => setThemeState(toggleTheme())}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
    >
      <span aria-hidden>{theme === 'dark' ? '☀️' : '🌙'}</span>
    </button>
  );
}

function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .split(' ')
    .filter(Boolean);
  if (words.length === 0) return 'JM';
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

function ProfileMenu() {
  const { data: settings } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));

  const name = settings?.businessName || 'Job Master';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white transition hover:bg-brand-700"
      >
        {initials(name)}
      </button>
      {open && (
        <div className="animate-panel absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-surface py-1 shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
            <p className="mt-0.5 text-xs text-slate-500">Stored on this device</p>
          </div>
          <Link to="/settings" className={menuItemCls} onClick={() => setOpen(false)}>
            Settings
          </Link>
          <Link to="/reports" className={menuItemCls} onClick={() => setOpen(false)}>
            Reports
          </Link>
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global ⌘K / Ctrl+K opens the search palette.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-surface px-8 py-3">
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="flex w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 transition hover:border-slate-300 hover:text-slate-500"
      >
        <span aria-hidden>🔍</span>
        <span className="flex-1 text-left">Search jobs, clients, invoices…</span>
        <kbd className="rounded border border-slate-200 bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
          {isMacLike() ? '⌘K' : 'Ctrl K'}
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <NewMenu />
        <ThemeToggle />
        <RemindersBell />
        <ProfileMenu />
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  );
}
