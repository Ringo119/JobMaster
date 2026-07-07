import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useJobs } from '../hooks/useJobs';
import { useClients } from '../hooks/useClients';
import { STATUS_STYLES, visualStatus } from '../lib/jobStatus';
import { today } from '../lib/dates';
import type { Job } from '../data/models/job';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_CHIPS = 3;

export function CalendarPage() {
  const { data: jobs, isLoading } = useJobs();
  const { data: clients } = useClients();

  const [month, setMonth] = useState<Date>(() => startOfMonth(today()));

  const clientNames = useMemo(
    () => new Map((clients ?? []).map((c) => [c.id, c.name])),
    [clients],
  );

  /** Jobs that can be placed on the grid, indexed by their returnDate (yyyy-MM-dd). */
  const { jobsByDate, asapJobs } = useMemo(() => {
    const all = jobs ?? [];
    const byDate = new Map<string, Job[]>();
    const asap: Job[] = [];

    for (const job of all) {
      if (job.isAsap || !job.returnDate) {
        asap.push(job);
        continue;
      }
      const key = job.returnDate;
      const list = byDate.get(key);
      if (list) list.push(job);
      else byDate.set(key, [job]);
    }

    return { jobsByDate: byDate, asapJobs: asap };
  }, [jobs]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );

  const subtitle = 'Jobs by return date — keep an eye on what lands when.';

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Calendar" subtitle={subtitle} />
        <Card className="p-8 text-center text-sm text-slate-500">Loading calendar…</Card>
      </div>
    );
  }

  const hasAnyJob = (jobs ?? []).length > 0;
  const now = today();

  function clientLabel(job: Job): string {
    const name = clientNames.get(job.clientId) ?? 'Unknown';
    return job.project ? `${name} · ${job.project}` : name;
  }

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setMonth((m) => addMonths(m, -1))}>
              ‹ Prev
            </Button>
            <Button variant="secondary" onClick={() => setMonth(startOfMonth(now))}>
              Today
            </Button>
            <Button variant="secondary" onClick={() => setMonth((m) => addMonths(m, 1))}>
              Next ›
            </Button>
          </div>
        }
      />

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-800">
          {format(month, 'MMMM yyyy')}
        </h2>
      </div>

      {asapJobs.length > 0 && (
        <Card className="mb-4 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">ASAP / unscheduled</h3>
          <div className="flex flex-wrap gap-2">
            {asapJobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
              >
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                  ASAP
                </span>
                {clientLabel(job)}
              </Link>
            ))}
          </div>
        </Card>
      )}

      {!hasAnyJob ? (
        <Card>
          <EmptyState
            title="Nothing on the calendar yet"
            hint="Jobs with a return date appear here automatically."
            action={
              <Link to="/jobs/new">
                <Button>+ New Job</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="px-2 py-2 text-center text-xs font-semibold text-slate-500"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayJobs = jobsByDate.get(key) ?? [];
              const inMonth = isSameMonth(day, month);
              const isToday = isSameDay(day, now);
              const shown = dayJobs.slice(0, MAX_CHIPS);
              const extra = dayJobs.length - shown.length;

              return (
                <div
                  key={key}
                  className={`min-h-[6.5rem] border-b border-r border-slate-100 p-1.5 ${
                    inMonth ? 'bg-surface' : 'bg-slate-50/60'
                  }`}
                >
                  <div className="mb-1 flex justify-end">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isToday
                          ? 'bg-brand-600 font-semibold text-white'
                          : inMonth
                            ? 'text-slate-700'
                            : 'text-slate-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {shown.map((job) => {
                      const style = STATUS_STYLES[visualStatus(job)];
                      return (
                        <Link
                          key={job.id}
                          to={`/jobs/${job.id}`}
                          title={style.label}
                          className={`block truncate rounded px-1.5 py-0.5 text-[11px] font-medium hover:opacity-80 ${style.badge}`}
                        >
                          {clientLabel(job)}
                        </Link>
                      );
                    })}
                    {extra > 0 && (
                      <div className="px-1.5 text-[11px] font-medium text-slate-400">
                        +{extra} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
