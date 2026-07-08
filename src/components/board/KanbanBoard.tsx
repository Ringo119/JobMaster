import { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import type { JobTask, TaskStatus } from '../../data/models/task';
import { TASK_STATUSES, TASK_STATUS_LABELS } from '../../data/models/task';
import { TASK_STATUS_STYLES } from '../../lib/taskStatus';
import {
  useTasksByJob,
  useCreateTask,
  useUpdateTask,
  useRemoveTask,
} from '../../hooks/useTasks';
import { isOverdue } from '../../lib/dates';

/** Compact UK day/month, e.g. "02/06" — full years would crowd the cards. */
function formatDM(iso: string | null): string {
  if (!iso) return '';
  const d = parseISO(iso);
  return isValid(d) ? format(d, 'dd/MM') : '';
}

function dateRangeLabel(task: JobTask): string | null {
  const start = formatDM(task.startDate);
  const end = formatDM(task.endDate);
  if (start && end) return `${start} → ${end}`;
  if (start) return `${start} →`;
  if (end) return `→ ${end}`;
  return null;
}

/**
 * Inline quick-add at the foot of each column — mirrors the Planner's
 * AddTaskRow but creates the task straight into this column's status.
 */
function QuickAdd({ jobId, status }: { jobId: string; status: TaskStatus }) {
  const createTask = useCreateTask();
  const [title, setTitle] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || createTask.isPending) return;
    await createTask.mutateAsync({
      jobId,
      title: trimmed,
      status,
      startDate: null,
      endDate: null,
    });
    setTitle('');
  }

  return (
    <form onSubmit={handleAdd} className="mt-2 flex items-center gap-1.5">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task…"
        aria-label={`New task in ${TASK_STATUS_LABELS[status]}`}
        className="w-full min-w-0 rounded border border-slate-300 bg-surface px-1.5 py-1 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none"
      />
      <button
        type="submit"
        disabled={createTask.isPending || !title.trim()}
        className="shrink-0 text-[11px] font-medium text-brand-600 transition hover:text-brand-700 disabled:opacity-40"
      >
        Add
      </button>
    </form>
  );
}

function TaskCard({
  task,
  onDragStart,
  onDragEnd,
}: {
  task: JobTask;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const updateTask = useUpdateTask();
  const removeTask = useRemoveTask();

  const done = task.status === 'done';
  const overdue = !done && isOverdue(task.endDate);
  const dates = dateRangeLabel(task);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-lg border p-2 shadow-sm transition active:cursor-grabbing ${
        overdue
          ? 'border-red-300 bg-red-50'
          : 'border-slate-200 bg-surface hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <span
          className={`min-w-0 break-words text-xs ${
            done ? 'text-slate-400 line-through' : 'font-medium text-slate-800'
          }`}
        >
          {task.title}
        </span>
        <button
          type="button"
          aria-label={`Remove task ${task.title}`}
          onClick={() => removeTask.mutate(task.id)}
          className="shrink-0 rounded px-1 text-xs text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
        >
          ✕
        </button>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-1.5">
        {dates ? (
          <span
            className={`truncate text-[11px] ${
              overdue ? 'font-semibold text-red-600' : 'text-slate-500'
            }`}
          >
            {dates}
            {overdue && <span className="ml-1">· Overdue</span>}
          </span>
        ) : (
          <span />
        )}
        {/* Keyboard/touch fallback for drag & drop. */}
        <select
          value={task.status}
          onChange={(e) =>
            updateTask.mutate({ id: task.id, patch: { status: e.target.value as TaskStatus } })
          }
          aria-label={`Move task ${task.title} to column`}
          className="shrink-0 rounded border border-slate-200 bg-surface px-0.5 py-0.5 text-[10px] text-slate-500 focus:border-brand-600 focus:outline-none"
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function KanbanBoard({ jobId }: { jobId: string }) {
  const { data: tasks, isLoading } = useTasksByJob(jobId);
  const updateTask = useUpdateTask();

  // Which column is currently being dragged over (for the drop highlight).
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const [dragging, setDragging] = useState(false);

  if (isLoading) {
    return <p className="py-6 text-center text-sm text-slate-500">Loading board…</p>;
  }

  const all = tasks ?? [];

  function handleDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    setDragOver(null);
    setDragging(false);
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const task = all.find((t) => t.id === id);
    if (!task || task.status === status) return;
    updateTask.mutate({ id, patch: { status } });
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[540px] grid-cols-3 gap-3">
        {TASK_STATUSES.map((status) => {
          const style = TASK_STATUS_STYLES[status];
          const columnTasks = all.filter((t) => t.status === status);
          const isTarget = dragOver === status;

          return (
            <section
              key={status}
              aria-label={`${TASK_STATUS_LABELS[status]} column`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOver !== status) setDragOver(status);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOver((s) => (s === status ? null : s));
                }
              }}
              onDrop={(e) => handleDrop(e, status)}
              className={`flex flex-col rounded-xl border p-2.5 transition ${
                isTarget
                  ? 'border-brand-600/50 bg-slate-100 ring-2 ring-brand-600/30'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <header className="flex items-center gap-1.5 px-0.5 pb-2">
                <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                <h3 className="text-xs font-semibold text-slate-700">
                  {TASK_STATUS_LABELS[status]}
                </h3>
                <span
                  className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${style.badge}`}
                >
                  {columnTasks.length}
                </span>
              </header>

              <div className="flex min-h-[72px] flex-1 flex-col gap-1.5">
                {columnTasks.length === 0 ? (
                  <p
                    className={`flex flex-1 items-center justify-center rounded-lg border border-dashed px-2 py-4 text-center text-[11px] ${
                      dragging ? 'border-slate-300 text-slate-500' : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    Nothing here yet
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDragging(true);
                      }}
                      onDragEnd={() => {
                        setDragging(false);
                        setDragOver(null);
                      }}
                    />
                  ))
                )}
              </div>

              <QuickAdd jobId={jobId} status={status} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
