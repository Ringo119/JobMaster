import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { useJobs, useUpdateJob } from '../hooks/useJobs';
import { useClients } from '../hooks/useClients';
import { formatGBP } from '../lib/currency';
import { toISODate } from '../lib/dates';
import { STATUS_STYLES, visualStatus, type VisualStatus } from '../lib/jobStatus';
import type { Job } from '../data/models/job';

const LABEL_COL = 180;
const DAY_W = 34; // fixed day-column width so drag maps pixels → days exactly
const END_PADDING_DAYS = 4;

const DEFAULT_SPAN_DAYS = 5;

/**
 * A job's effective bar start/end as Dates, or null if it can't be placed.
 *
 * Duration is driven by the start date and the task's estimated days: a job's
 * bar runs from its start date for `estimatedDays`. The return date is only
 * consulted to size the bar when no estimate is provided.
 */
function jobBarRange(job: Job): { start: Date; end: Date } | null {
  const start = job.startDate ? parseISO(job.startDate) : null;
  const end = job.returnDate ? parseISO(job.returnDate) : null;
  const hasEstimate = typeof job.estimatedDays === 'number' && job.estimatedDays > 0;

  if (start) {
    // Prefer the estimate from the start date; fall back to the return date,
    // then to a default span when neither is available.
    if (hasEstimate) return { start, end: addDays(start, job.estimatedDays!) };
    if (end) return { start, end };
    return { start, end: addDays(start, DEFAULT_SPAN_DAYS) };
  }
  if (end) {
    // Only a return date — derive a start from the estimate (or default span).
    const span = hasEstimate ? job.estimatedDays! : DEFAULT_SPAN_DAYS;
    return { start: addDays(end, -span), end };
  }
  return null;
}

/** Shift whichever real dates a job has by a number of days. */
function shiftJobDates(job: Job, deltaDays: number): Partial<Job> {
  const patch: Partial<Job> = {};
  if (job.startDate) patch.startDate = toISODate(addDays(parseISO(job.startDate), deltaDays));
  if (job.returnDate) patch.returnDate = toISODate(addDays(parseISO(job.returnDate), deltaDays));
  return patch;
}

const LEGEND: { status: VisualStatus; label: string }[] = [
  { status: 'working', label: 'Working' },
  { status: 'planning', label: 'Planning' },
  { status: 'submitted', label: 'Submitted' },
  { status: 'invoiced', label: 'Invoiced / Paid' },
  { status: 'overdue', label: 'Overdue' },
];

interface DragState {
  jobId: string;
  startX: number;
  dayDelta: number;
  moved: boolean;
}

export function PlannerPage() {
  const { data: jobs, isLoading } = useJobs();
  const { data: clients } = useClients();
  const updateJob = useUpdateJob();
  const navigate = useNavigate();

  const [drag, setDrag] = useState<DragState | null>(null);

  const clientNames = useMemo(
    () => new Map((clients ?? []).map((c) => [c.id, c.name])),
    [clients],
  );

  const model = useMemo(() => {
    const all = jobs ?? [];
    const asapJobs = all.filter((j) => jobBarRange(j) === null);

    const datable = all
      .map((job) => ({ job, range: jobBarRange(job)! }))
      .filter((row) => row.range !== null);

    if (datable.length === 0) {
      return { asapJobs, datable: [], windowStart: null as Date | null, totalDays: 0 };
    }

    let minDate = datable[0].range.start;
    let maxDate = datable[0].range.end;
    for (const { range } of datable) {
      if (range.start < minDate) minDate = range.start;
      if (range.end > maxDate) maxDate = range.end;
    }

    const windowStart = startOfWeek(minDate, { weekStartsOn: 1 });
    const windowEnd = addDays(maxDate, END_PADDING_DAYS);
    const totalDays = differenceInCalendarDays(windowEnd, windowStart) + 1;

    // Sort by client name, then by bar start.
    datable.sort((a, b) => {
      const ca = clientNames.get(a.job.clientId) ?? '';
      const cb = clientNames.get(b.job.clientId) ?? '';
      if (ca !== cb) return ca.localeCompare(cb);
      return a.range.start.getTime() - b.range.start.getTime();
    });

    return { asapJobs, datable, windowStart, totalDays };
  }, [jobs, clientNames]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Planner" subtitle="Your jobs across the weeks ahead." />
        <Card className="p-8 text-center text-sm text-slate-500">Loading planner…</Card>
      </div>
    );
  }

  const { asapJobs, datable, windowStart, totalDays } = model;

  if (!windowStart || datable.length === 0) {
    return (
      <div>
        <PageHeader title="Planner" subtitle="Your jobs across the weeks ahead." />
        <Card className="p-8 text-center text-sm text-slate-500">
          No scheduled jobs to plot yet. Add start or return dates to jobs to see them here.
        </Card>
      </div>
    );
  }

  const days = Array.from({ length: totalDays }, (_, i) => addDays(windowStart, i));
  const gridTemplateColumns = `${LABEL_COL}px repeat(${totalDays}, ${DAY_W}px)`;

  const handlePointerDown = (e: React.PointerEvent, job: Job) => {
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDrag({ jobId: job.id, startX: e.clientX, dayDelta: 0, moved: false });
  };

  const handlePointerMove = (e: React.PointerEvent, job: Job) => {
    setDrag((d) => {
      if (!d || d.jobId !== job.id) return d;
      const dayDelta = Math.round((e.clientX - d.startX) / DAY_W);
      const moved = d.moved || Math.abs(e.clientX - d.startX) > 3;
      if (dayDelta === d.dayDelta && moved === d.moved) return d;
      return { ...d, dayDelta, moved };
    });
  };

  const handlePointerUp = (job: Job) => {
    setDrag((d) => {
      if (!d || d.jobId !== job.id) return null;
      if (d.dayDelta !== 0) {
        const patch = shiftJobDates(job, d.dayDelta);
        if (Object.keys(patch).length > 0) {
          updateJob.mutate({ id: job.id, patch });
        }
      } else if (!d.moved) {
        // A plain click opens the job.
        navigate(`/jobs/${job.id}`);
      }
      return null;
    });
  };

  return (
    <div>
      <PageHeader
        title="Planner"
        subtitle="Your jobs across the weeks ahead — drag a bar to reschedule."
      />

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        {LEGEND.map(({ status, label }) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-4 rounded ${STATUS_STYLES[status].bar}`} />
            {label}
          </span>
        ))}
      </div>

      {asapJobs.length > 0 && (
        <Card className="mb-4 p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Unscheduled / ASAP</h2>
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
                {clientNames.get(job.clientId) ?? 'Unknown'}
                {job.project ? ` · ${job.project}` : ''}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        {/* The scroll container has no horizontal padding so its clip edge lines
            up with the sticky label column — otherwise scrolled bars bleed into
            the padding strip to the left of each name. */}
        <div className="overflow-x-auto">
          <div className="min-w-max select-none">
          {/* Month label row */}
          <div className="grid" style={{ gridTemplateColumns }}>
            <div className="sticky left-0 z-10 bg-white" />
            {days.map((d, i) => {
              const isFirstOfMonth = d.getDate() === 1 || i === 0;
              return (
                <div
                  key={`m-${i}`}
                  className="h-5 truncate text-[11px] font-medium text-slate-500"
                >
                  {isFirstOfMonth ? format(d, 'MMM') : ''}
                </div>
              );
            })}
          </div>

          {/* Day-of-month header row */}
          <div
            className="grid border-b border-slate-200 pb-1"
            style={{ gridTemplateColumns }}
          >
            <div className="sticky left-0 z-10 bg-white text-xs font-semibold text-slate-500">
              Job
            </div>
            {days.map((d, i) => {
              const isWeekStart = d.getDay() === 1;
              return (
                <div
                  key={`d-${i}`}
                  className={`text-center text-[11px] ${
                    isWeekStart
                      ? 'border-l border-slate-300 font-semibold text-slate-600'
                      : 'text-slate-400'
                  }`}
                >
                  {format(d, 'd')}
                </div>
              );
            })}
          </div>

          {/* Job rows */}
          {datable.map(({ job, range }) => {
            const startCol = 2 + differenceInCalendarDays(range.start, windowStart);
            const barLength = Math.max(
              1,
              differenceInCalendarDays(range.end, range.start) + 1,
            );
            const endCol = startCol + barLength;
            const style = STATUS_STYLES[visualStatus(job)];
            const clientName = clientNames.get(job.clientId) ?? 'Unknown';
            const isDragging = drag?.jobId === job.id;
            const offsetX = isDragging ? drag.dayDelta * DAY_W : 0;

            return (
              <div
                key={job.id}
                className="grid items-center border-b border-slate-100 last:border-0"
                style={{ gridTemplateColumns }}
              >
                <Link
                  to={`/jobs/${job.id}`}
                  className="sticky left-0 z-10 block min-w-0 truncate bg-white py-2 pr-2 text-xs hover:text-brand-600"
                  title={`${clientName} · #${job.jobNumber}${job.project ? ` · ${job.project}` : ''}`}
                >
                  <span className="font-medium text-slate-700">{clientName}</span>
                  <span className="ml-1 text-slate-400">#{job.jobNumber}</span>
                  {job.project && (
                    <span className="block truncate text-slate-500">{job.project}</span>
                  )}
                </Link>

                {/* The bar — draggable to reschedule; a plain click opens the job. */}
                <div
                  role="button"
                  tabIndex={0}
                  onPointerDown={(e) => handlePointerDown(e, job)}
                  onPointerMove={(e) => handlePointerMove(e, job)}
                  onPointerUp={() => handlePointerUp(job)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/jobs/${job.id}`);
                  }}
                  className={`my-1 flex h-6 touch-none items-center overflow-hidden rounded px-2 ${style.bar} ${
                    isDragging ? 'cursor-grabbing opacity-90 ring-2 ring-slate-900/20' : 'cursor-grab'
                  }`}
                  style={{
                    gridColumn: `${startCol} / ${endCol}`,
                    transform: offsetX ? `translateX(${offsetX}px)` : undefined,
                  }}
                  title={`${style.label} · ${formatGBP(job.feeNetPence)} — drag to reschedule`}
                >
                  <span className="truncate text-xs text-white">
                    {job.project || formatGBP(job.feeNetPence)}
                  </span>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </Card>
    </div>
  );
}
