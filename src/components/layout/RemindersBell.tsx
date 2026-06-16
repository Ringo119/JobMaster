import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReminders } from '../../hooks/useReminders';
import type { Reminder } from '../../lib/reminders';
import {
  notificationsSupported,
  notificationPermission,
  requestNotificationPermission,
  showNotification,
} from '../../lib/notify';

const DOT_COLOUR: Record<Reminder['severity'], string> = {
  urgent: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-slate-400',
};

export function RemindersBell() {
  const { reminders } = useReminders();
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    notificationPermission(),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const notifiedRef = useRef(false);

  const count = reminders.length;
  const urgentCount = reminders.filter((r) => r.severity === 'urgent').length;
  const hasUrgent = urgentCount > 0;

  // Close the panel when clicking outside of it.
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  // Best-effort desktop notification for urgent items — once per mount.
  useEffect(() => {
    if (notifiedRef.current) return;
    if (permission === 'granted' && hasUrgent) {
      notifiedRef.current = true;
      showNotification(
        'Job Master',
        `${urgentCount} urgent item(s) need your attention`,
      );
    }
  }, [permission, hasUrgent, urgentCount]);

  async function handleEnableAlerts() {
    const result = await requestNotificationPermission();
    setPermission(result);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Reminders"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <span aria-hidden="true">🔔</span>
        {count > 0 && (
          <span
            className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white ${
              hasUrgent ? 'bg-red-500' : 'bg-amber-500'
            }`}
          >
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-[28rem] w-[360px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-900">Reminders</span>
            <span className="text-xs font-medium text-slate-400">{count}</span>
          </div>

          {count === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              You're all caught up 🎉
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {reminders.map((reminder) => (
                <li key={reminder.id}>
                  <Link
                    to={reminder.to}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 px-4 py-3 transition hover:bg-slate-50"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_COLOUR[reminder.severity]}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">
                        {reminder.title}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {reminder.detail}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-slate-100 px-4 py-3">
            {notificationsSupported() && permission === 'default' && (
              <button
                type="button"
                onClick={handleEnableAlerts}
                className="text-xs font-medium text-brand-700 transition hover:text-brand-800"
              >
                Enable desktop alerts
              </button>
            )}
            {permission === 'granted' && (
              <span className="text-xs text-slate-400">Desktop alerts on</span>
            )}
            {(permission === 'denied' || !notificationsSupported()) && (
              <span className="text-xs text-slate-400">Desktop alerts blocked</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
