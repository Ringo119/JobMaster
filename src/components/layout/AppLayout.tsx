import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { RemindersBell } from './RemindersBell';

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer on navigation so the page is visible after a tap.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-full">
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
          {/* Hamburger — mobile only; opens the navigation drawer. */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl leading-none text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            ☰
          </button>
          {/* Spacer keeps the bell right-aligned on desktop, where there's no hamburger. */}
          <div className="hidden lg:block" />
          <RemindersBell />
        </header>
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
