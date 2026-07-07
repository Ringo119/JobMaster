import type { ReactNode } from 'react';

/**
 * Illustrated empty state for tables and lists — friendlier than a bare
 * "No rows" line, and gives first-run users an obvious next step.
 */
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <svg
        width="72"
        height="56"
        viewBox="0 0 72 56"
        fill="none"
        aria-hidden="true"
        className="text-slate-300"
      >
        <rect x="8" y="10" width="56" height="40" rx="6" stroke="currentColor" strokeWidth="2.5" />
        <path d="M8 20h56" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="15" cy="15" r="1.75" fill="currentColor" />
        <circle cx="21" cy="15" r="1.75" fill="currentColor" />
        <path
          d="M22 34h18M22 41h28"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M50 30l4 4 7-8"
          stroke="#22c55e"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
