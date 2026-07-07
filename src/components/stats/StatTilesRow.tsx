import { useMemo, type ReactNode } from 'react';
import { Card } from '../ui/Card';
import { useJobs } from '../../hooks/useJobs';
import { useInvoices } from '../../hooks/useInvoices';
import { computeTileStats, type WeekDelta } from '../../lib/stats';
import { formatGBP } from '../../lib/currency';

function DeltaLine({ delta }: { delta: WeekDelta }) {
  if (delta.pct === null) {
    return <span className="text-xs text-slate-400">last week: {delta.lastWeekCount}</span>;
  }
  if (delta.pct === 0) {
    return <span className="text-xs text-slate-400">same as last week</span>;
  }
  const up = delta.pct > 0;
  return (
    <span className={`text-xs font-medium ${up ? 'text-green-600' : 'text-red-600'}`}>
      {up ? '↑' : '↓'} {Math.abs(delta.pct)}% from last week
    </span>
  );
}

function Tile({
  icon,
  iconBg,
  label,
  value,
  foot,
}: {
  icon: string;
  iconBg: string;
  label: string;
  value: ReactNode;
  foot: ReactNode;
}) {
  return (
    <Card className="flex items-start gap-3 p-4 transition hover:shadow-md">
      <span
        aria-hidden
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${iconBg}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-slate-500">{label}</span>
        <span className="block text-2xl font-semibold text-slate-900">{value}</span>
        <span className="block leading-tight">{foot}</span>
      </span>
    </Card>
  );
}

/**
 * The mockup's tile row: Active Jobs, Scheduled This Week, Completed This Week,
 * Outstanding Invoices. (Team Utilisation waits for multi-user.)
 */
export function StatTilesRow() {
  const { data: jobs } = useJobs();
  const { data: invoices } = useInvoices();

  const stats = useMemo(
    () => computeTileStats(jobs ?? [], invoices ?? []),
    [jobs, invoices],
  );

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
      <Tile
        icon="💼"
        iconBg="bg-brand-100"
        label="Active Jobs"
        value={stats.activeCount}
        foot={
          <span className="text-xs text-slate-400">
            {stats.newThisWeekCount > 0
              ? `+${stats.newThisWeekCount} new this week`
              : 'none added this week'}
          </span>
        }
      />
      <Tile
        icon="🕒"
        iconBg="bg-amber-100"
        label="Scheduled This Week"
        value={stats.scheduledThisWeek.count}
        foot={<DeltaLine delta={stats.scheduledThisWeek.delta} />}
      />
      <Tile
        icon="✅"
        iconBg="bg-green-100"
        label="Completed This Week"
        value={stats.completedThisWeek.count}
        foot={<DeltaLine delta={stats.completedThisWeek.delta} />}
      />
      <Tile
        icon="🧾"
        iconBg="bg-violet-100"
        label="Outstanding Invoices"
        value={formatGBP(stats.outstandingPence)}
        foot={
          <span
            className={`text-xs font-medium ${
              stats.overdueInvoiceCount > 0 ? 'text-red-600' : 'text-slate-400'
            }`}
          >
            {stats.overdueInvoiceCount > 0
              ? `${stats.overdueInvoiceCount} overdue`
              : 'nothing overdue'}
          </span>
        }
      />
    </div>
  );
}
