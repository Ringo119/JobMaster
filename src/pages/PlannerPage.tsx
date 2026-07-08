import { useMemo, useRef, useState, useEffect } from 'react';
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
import { Button } from '../components/ui/Button';
import { StatTilesRow } from '../components/stats/StatTilesRow';
import { useJobs, useUpdateJob } from '../hooks/useJobs';
import { useClients } from '../hooks/useClients';
import {
  useAllTasks,
  useCreateTask,
  useUpdateTask,
  useRemoveTask,
} from '../hooks/useTasks';
import { formatGBP } from '../lib/currency';
import { today, toISODate } from '../lib/dates';
import { STATUS_STYLES, visualStatus, type VisualStatus } from '../lib/jobStatus';
import { JOB_STATUSES, JOB_STATUS_LABELS, type JobStatus } from '../data/models/job';
import type { Job } from '../data/models/job';
import type { JobTask } from '../data/models/task';

const LABEL_COL = 200;
const END_PADDING_DAYS = 4;

type ViewMode = 'week' | 'twoweek' | 'month';

/** Days shown and pixel width per day column for each zoom level. */
const VIEWS: Record<ViewMode, { label: string; days: number; dayW: number }> = {
  week: { label: 'Week', days: 7, dayW: 96 },
  twoweek: { label: '2 Weeks', days: 14, dayW: 48 },
  month: { label: 'Month', days: 31, dayW: 32 },
};

/** A job's effective bar start/end as Dates, or null if it can't be placed. */
function jobBarRange(job: Job): { start: Date; end: Date } | null {
  const start = job.startDate ? parseISO(job.startDate) : null;
  const end = job.returnDate ? parseISO(job.returnDate) : null;

  if (start && end) return { start, end };
  if (end) {
    // Derive a start from the estimate when only a return date is known.
    const span = job.estimatedDays && job.estimatedDays > 0 ? job.estimatedDays : 5;
    return { start: addDays(end, -span), end };
  }
  if (start) {
    const span = job.estimatedDays && job.estimatedDays > 0 ? job.estimatedDays : 5;
    return { start, end: addDays(start, span) };
  }
  return null;
}

function taskBarRange(task: JobTask): { start: Date; end: Date } | null {
  if (!task.startDate || !task.endDate) return null;
  const start = parseISO(task.startDate);
  const end = parseISO(task.endDate);
  return end < start ? { start: end, end: start } : { start, end };
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

const taskDateInputCls =
  'shrink-0 rounded border border-slate-300 bg-surface px-1 py-0.5 text-[11px] text-slate-600 focus:border-brand-600 focus:outline-none';

/**
 * Inline add-task row shown under an expanded job — tasks can be added right
 * from the Planner without opening the job. Dates are optional; a task given
 * both dates renders as a bar immediately.
 */
function AddTaskRow({ jobId }: { jobId: string }) {
  const createTask = useCreateTask();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || createTask.isPending) return;
    await createTask.mutateAsync({
      jobId,
      title: trimmed,
      done: false,
      startDate: startDate || null,
      endDate: endDate || null,
    });
    setTitle('');
    setStartDate('');
    setEndDate('');
  }

  return (
    // The form spans the whole scroll row but sticks to the left edge, giving
    // the date pickers room beyond the narrow label column.
    <div>
      <form
        onSubmit={handleAdd}
        className="sticky left-0 z-10 flex w-max items-center gap-1.5 bg-surface py-1 pl-6 pr-2"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          aria-label="New task title"
          className="w-36 min-w-0 rounded border border-slate-300 bg-surface px-1.5 py-0.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          aria-label="New task start date"
          title="Start date (optional)"
          className={taskDateInputCls}
        />
        <span aria-hidden className="text-[11px] text-slate-400">
          →
        </span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          aria-label="New task end date"
          title="End date (optional)"
          className={taskDateInputCls}
        />
        <button
          type="submit"
          disabled={createTask.isPending || !title.trim()}
          className="shrink-0 text-[11px] font-medium text-brand-600 transition hover:text-brand-700 disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
}

/** Inline editor for an existing task — mounts fresh so state seeds from the task. */
function EditTaskForm({ task, onClose }: { task: JobTask; onClose: () => void }) {
  const updateTask = useUpdateTask();
  const removeTask = useRemoveTask();
  const [title, setTitle] = useState(task.title);
  const [startDate, setStartDate] = useState(task.startDate ?? '');
  const [endDate, setEndDate] = useState(task.endDate ?? '');

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || updateTask.isPending) return;
    updateTask.mutate({
      id: task.id,
      patch: { title: trimmed, startDate: startDate || null, endDate: endDate || null },
    });
    onClose();
  }

  return (
    <div>
      <form
        onSubmit={handleSave}
        className="sticky left-0 z-10 flex w-max items-center gap-1.5 bg-surface py-1 pl-6 pr-2"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Task title"
          autoFocus
          className="w-36 min-w-0 rounded border border-slate-300 bg-surface px-1.5 py-0.5 text-[11px] text-slate-700 focus:border-brand-600 focus:outline-none"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          aria-label="Task start date"
          className={taskDateInputCls}
        />
        <span aria-hidden className="text-[11px] text-slate-400">
          →
        </span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          aria-label="Task end date"
          className={taskDateInputCls}
        />
        <button
          type="submit"
          disabled={updateTask.isPending || !title.trim()}
          className="shrink-0 text-[11px] font-medium text-brand-600 transition hover:text-brand-700 disabled:opacity-40"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-[11px] font-medium text-slate-500 transition hover:text-slate-700"
        >
          Cancel
        </button>
        <button
          type="button"
          aria-label={`Remove task ${task.title}`}
          onClick={() => {
            removeTask.mutate(task.id);
            onClose();
          }}
          className="shrink-0 rounded px-1 text-[11px] text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        >
          ✕
        </button>
      </form>
    </div>
  );
}

/**
 * One task under an expanded job: checkbox to mark done, pencil (or a click on
 * the bar) to edit title/dates inline, all without leaving the Planner.
 */
function TaskSubRow({
  task,
  cols,
  gridTemplateColumns,
}: {
  task: JobTask;
  cols: { start: number; end: number } | null;
  gridTemplateColumns: string;
}) {
  const updateTask = useUpdateTask();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EditTaskForm task={task} onClose={() => setEditing(false)} />;
  }

  return (
    <div className="group grid items-center" style={{ gridTemplateColumns }}>
      <div className="sticky left-0 z-10 flex min-w-0 items-center gap-1.5 bg-surface py-1 pl-6 pr-2">
        <input
          type="checkbox"
          checked={task.done}
          onChange={(e) => updateTask.mutate({ id: task.id, patch: { done: e.target.checked } })}
          aria-label={`Mark ${task.title} as ${task.done ? 'not done' : 'done'}`}
          className="h-3 w-3 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
        />
        <span
          className={`truncate text-[11px] ${
            task.done ? 'text-slate-400 line-through' : 'text-slate-500'
          }`}
        >
          {task.title}
        </span>
        <button
          type="button"
          aria-label={`Edit task ${task.title}`}
          onClick={() => setEditing(true)}
          className="shrink-0 rounded px-0.5 text-[11px] text-slate-300 opacity-0 transition hover:text-slate-600 focus:opacity-100 group-hover:opacity-100"
        >
          ✎
        </button>
      </div>
      {cols && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`my-0.5 flex h-5 items-center overflow-hidden rounded px-2 transition hover:opacity-90 ${
            task.done ? 'bg-violet-300' : 'bg-violet-500'
          }`}
          style={{ gridColumn: `${cols.start} / ${cols.end}` }}
          title={`${task.title} — click to edit`}
        >
          <span className="truncate text-[11px] text-white">{task.title}</span>
        </button>
      )}
    </div>
  );
}

interface DragState {
  jobId: string;
  startX: number;
  dayDelta: number;
  moved: boolean;
}

interface Filters {
  clientId: string | 'all';
  status: JobStatus | 'all';
}

function FiltersPopover({
  filters,
  onChange,
  clients,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  clients: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  const activeCount =
    (filters.clientId !== 'all' ? 1 : 0) + (filters.status !== 'all' ? 1 : 0);

  const selectCls =
    'w-full rounded-lg border border-slate-300 bg-surface px-2.5 py-1.5 text-sm text-slate-800 focus:border-brand-600 focus:outline-none';

  return (
    <div ref={ref} className="relative">
      <Button variant="secondary" onClick={() => setOpen((v) => !v)}>
        Filters
        {activeCount > 0 && (
          <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="animate-panel absolute right-0 top-full z-40 mt-2 w-64 space-y-3 rounded-xl border border-slate-200 bg-surface p-4 shadow-lg">
          <div>
            <label htmlFor="plannerClient" className="mb-1 block text-xs font-semibold text-slate-500">
              Client
            </label>
            <select
              id="plannerClient"
              className={selectCls}
              value={filters.clientId}
              onChange={(e) => onChange({ ...filters, clientId: e.target.value })}
            >
              <option value="all">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="plannerStatus" className="mb-1 block text-xs font-semibold text-slate-500">
              Status
            </label>
            <select
              id="plannerStatus"
              className={selectCls}
              value={filters.status}
              onChange={(e) =>
                onChange({ ...filters, status: e.target.value as Filters['status'] })
              }
            >
              <option value="all">All statuses</option>
              {JOB_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {JOB_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
              onClick={() => onChange({ clientId: 'all', status: 'all' })}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function PlannerPage() {
  const { data: jobs, isLoading } = useJobs();
  const { data: clients } = useClients();
  const { data: tasks } = useAllTasks();
  const updateJob = useUpdateJob();
  const navigate = useNavigate();

  const [view, setView] = useState<ViewMode>('twoweek');
  const [anchor, setAnchor] = useState<Date>(() => startOfWeek(today(), { weekStartsOn: 1 }));
  const [filters, setFilters] = useState<Filters>({ clientId: 'all', status: 'all' });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [drag, setDrag] = useState<DragState | null>(null);

  const { days: totalDays, dayW } = VIEWS[view];
  const windowStart = anchor;
  const windowEnd = addDays(windowStart, totalDays - 1);

  const clientNames = useMemo(
    () => new Map((clients ?? []).map((c) => [c.id, c.name])),
    [clients],
  );

  const tasksByJob = useMemo(() => {
    const map = new Map<string, JobTask[]>();
    for (const task of tasks ?? []) {
      const list = map.get(task.jobId);
      if (list) list.push(task);
      else map.set(task.jobId, [task]);
    }
    return map;
  }, [tasks]);

  const model = useMemo(() => {
    let all = jobs ?? [];
    if (filters.clientId !== 'all') all = all.filter((j) => j.clientId === filters.clientId);
    if (filters.status !== 'all') all = all.filter((j) => j.status === filters.status);

    const asapJobs = all.filter((j) => jobBarRange(j) === null);
    const datable = all
      .map((job) => ({ job, range: jobBarRange(job)! }))
      .filter((row) => row.range !== null);

    // Sort by client name, then by bar start.
    datable.sort((a, b) => {
      const ca = clientNames.get(a.job.clientId) ?? '';
      const cb = clientNames.get(b.job.clientId) ?? '';
      if (ca !== cb) return ca.localeCompare(cb);
      return a.range.start.getTime() - b.range.start.getTime();
    });

    return { asapJobs, datable };
  }, [jobs, clientNames, filters]);

  const { asapJobs, datable } = model;

  // Only rows whose bar touches the visible window (with a little slack) are shown.
  const visibleRows = useMemo(
    () =>
      datable.filter(
        ({ range }) =>
          range.start <= addDays(windowEnd, END_PADDING_DAYS) &&
          range.end >= addDays(windowStart, -END_PADDING_DAYS),
      ),
    [datable, windowStart, windowEnd],
  );

  const days = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => addDays(windowStart, i)),
    [windowStart, totalDays],
  );
  const gridTemplateColumns = `${LABEL_COL}px repeat(${totalDays}, ${dayW}px)`;

  const todayOffsetDays = differenceInCalendarDays(today(), windowStart);
  const todayInWindow = todayOffsetDays >= 0 && todayOffsetDays < totalDays;

  const toggleExpanded = (jobId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });

  const handlePointerDown = (e: React.PointerEvent, job: Job) => {
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDrag({ jobId: job.id, startX: e.clientX, dayDelta: 0, moved: false });
  };

  const handlePointerMove = (e: React.PointerEvent, job: Job) => {
    setDrag((d) => {
      if (!d || d.jobId !== job.id) return d;
      const dayDelta = Math.round((e.clientX - d.startX) / dayW);
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

  /** Grid columns for a bar clipped to the visible window, or null if outside. */
  const barColumns = (range: { start: Date; end: Date }): { start: number; end: number } | null => {
    const startDay = Math.max(0, differenceInCalendarDays(range.start, windowStart));
    const endDay = Math.min(totalDays - 1, differenceInCalendarDays(range.end, windowStart));
    if (endDay < 0 || startDay > totalDays - 1 || endDay < startDay) return null;
    return { start: 2 + startDay, end: 2 + endDay + 1 };
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Planner" subtitle="Your jobs across the weeks ahead." />
        <Card className="p-8 text-center text-sm text-slate-500">Loading planner…</Card>
      </div>
    );
  }

  const rangeLabel = `${format(windowStart, 'MMM d')} – ${format(windowEnd, 'MMM d, yyyy')}`;

  return (
    <div>
      <PageHeader
        title="Planner"
        subtitle="Your jobs across the weeks ahead — drag a bar to reschedule, expand a row to break the job into tasks."
      />

      <StatTilesRow />

      {/* Toolbar: date navigation, zoom, filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            onClick={() => setAnchor(startOfWeek(today(), { weekStartsOn: 1 }))}
          >
            Today
          </Button>
          <Button
            variant="secondary"
            aria-label="Previous period"
            onClick={() => setAnchor((a) => addDays(a, -totalDays))}
          >
            ‹
          </Button>
          <Button
            variant="secondary"
            aria-label="Next period"
            onClick={() => setAnchor((a) => addDays(a, totalDays))}
          >
            ›
          </Button>
        </div>
        <span className="text-sm font-semibold text-slate-700">{rangeLabel}</span>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-300 p-0.5">
            {(Object.keys(VIEWS) as ViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                  view === v
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {VIEWS[v].label}
              </button>
            ))}
          </div>
          <FiltersPopover
            filters={filters}
            onChange={setFilters}
            clients={(clients ?? []).map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        {LEGEND.map(({ status, label }) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-4 rounded ${STATUS_STYLES[status].bar}`} />
            {label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded bg-violet-500" />
          Task
        </span>
      </div>

      {asapJobs.length > 0 && (
        <Card className="mb-4 p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Unscheduled / ASAP</h2>
          <div className="flex flex-wrap gap-2">
            {asapJobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 transition hover:bg-red-200"
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
        {visibleRows.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-3xl" aria-hidden>
              📅
            </p>
            <p className="mt-2 text-sm font-medium text-slate-700">
              Nothing scheduled in this period
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Move the window with ‹ › or add dates to a job to see it here.
            </p>
          </div>
        ) : (
          /* The scroll container has no horizontal padding so its clip edge lines
             up with the sticky label column — otherwise scrolled bars bleed into
             the padding strip to the left of each name. */
          <div className="overflow-x-auto">
            <div className="relative min-w-max select-none">
              {/* Today marker */}
              {todayInWindow && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute bottom-0 top-0 z-20 border-l border-dashed border-brand-500/70"
                  style={{ left: LABEL_COL + todayOffsetDays * dayW }}
                />
              )}

              {/* Month label row */}
              <div className="grid" style={{ gridTemplateColumns }}>
                <div className="sticky left-0 z-10 bg-surface" />
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
                <div className="sticky left-0 z-10 bg-surface text-xs font-semibold text-slate-500">
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
                      {dayW >= 48 ? format(d, 'EEE d') : format(d, 'd')}
                    </div>
                  );
                })}
              </div>

              {/* Job rows */}
              {visibleRows.map(({ job, range }) => {
                const style = STATUS_STYLES[visualStatus(job)];
                const clientName = clientNames.get(job.clientId) ?? 'Unknown';
                const isDragging = drag?.jobId === job.id;
                const offsetX = isDragging ? drag.dayDelta * dayW : 0;
                const cols = barColumns(range);
                const jobTasks = tasksByJob.get(job.id) ?? [];
                const doneCount = jobTasks.filter((t) => t.done).length;
                const isExpanded = expanded.has(job.id);

                return (
                  <div key={job.id} className="border-b border-slate-100 last:border-0">
                    <div className="grid items-center" style={{ gridTemplateColumns }}>
                      <div className="sticky left-0 z-10 flex min-w-0 items-center gap-1 bg-surface py-2 pr-2">
                        <button
                          type="button"
                          aria-label={isExpanded ? 'Collapse tasks' : 'Expand tasks'}
                          aria-expanded={isExpanded}
                          onClick={() => toggleExpanded(job.id)}
                          className={`shrink-0 rounded p-0.5 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        >
                          ▸
                        </button>
                        <Link
                          to={`/jobs/${job.id}`}
                          className="min-w-0 flex-1 truncate text-xs hover:text-brand-600"
                          title={`${clientName} · #${job.jobNumber}${job.project ? ` · ${job.project}` : ''}`}
                        >
                          <span className="font-medium text-slate-700">{clientName}</span>
                          <span className="ml-1 text-slate-400">#{job.jobNumber}</span>
                          {job.project && (
                            <span className="block truncate text-slate-500">{job.project}</span>
                          )}
                        </Link>
                        {jobTasks.length > 0 && (
                          <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            {doneCount}/{jobTasks.length}
                          </span>
                        )}
                      </div>

                      {/* The bar — draggable to reschedule; a plain click opens the job. */}
                      {cols && (
                        <div
                          role="button"
                          tabIndex={0}
                          onPointerDown={(e) => handlePointerDown(e, job)}
                          onPointerMove={(e) => handlePointerMove(e, job)}
                          onPointerUp={() => handlePointerUp(job)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') navigate(`/jobs/${job.id}`);
                          }}
                          className={`my-1 flex h-6 touch-none items-center overflow-hidden rounded px-2 transition-shadow ${style.bar} ${
                            isDragging
                              ? 'cursor-grabbing opacity-90 ring-2 ring-slate-900/20'
                              : 'cursor-grab'
                          }`}
                          style={{
                            gridColumn: `${cols.start} / ${cols.end}`,
                            transform: offsetX ? `translateX(${offsetX}px)` : undefined,
                          }}
                          title={`${style.label} · ${formatGBP(job.feeNetPence)} — drag to reschedule`}
                        >
                          <span className="truncate text-xs text-white">
                            {job.project || formatGBP(job.feeNetPence)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Expanded task sub-rows + inline add */}
                    {isExpanded && (
                      <>
                        {jobTasks.map((task) => {
                          const tRange = taskBarRange(task);
                          const tCols = tRange ? barColumns(tRange) : null;
                          return (
                            <TaskSubRow
                              key={task.id}
                              task={task}
                              cols={tCols}
                              gridTemplateColumns={gridTemplateColumns}
                            />
                          );
                        })}
                        <AddTaskRow jobId={job.id} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-3 border-t border-slate-100 pt-3">
          <Link
            to="/jobs/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition hover:text-brand-700"
          >
            + Add Unscheduled Job
          </Link>
        </div>
      </Card>
    </div>
  );
}
