import { useState } from 'react';
import { Button } from '../ui/Button';

/** The editable fields of a task — what the inline planner editor works with. */
export interface TaskDraft {
  name: string;
  /** ISO yyyy-MM-dd. */
  startDate: string;
  durationDays: number;
  done: boolean;
}

const fieldCls =
  'mt-0.5 rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600';
const labelCls = 'block text-[10px] font-semibold uppercase tracking-wide text-slate-500';

/**
 * Inline editor for a job's sub-task, rendered as a row inside the Planner
 * grid. The caller keeps it sticky-left so it stays in view while the grid
 * scrolls horizontally.
 */
export function TaskEditor({
  initial,
  onSave,
  onCancel,
  onDelete,
  saving = false,
}: {
  initial: TaskDraft;
  onSave: (draft: TaskDraft) => void;
  onCancel: () => void;
  /** Present only when editing an existing task. */
  onDelete?: () => void;
  saving?: boolean;
}) {
  const [name, setName] = useState(initial.name);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [days, setDays] = useState(String(initial.durationDays));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Give the task a name.');
      return;
    }
    if (!startDate) {
      setError('Pick a start date.');
      return;
    }
    const durationDays = Number.parseInt(days, 10);
    if (Number.isNaN(durationDays) || durationDays < 1) {
      setError('Days must be at least 1.');
      return;
    }
    setError(null);
    onSave({ name: name.trim(), startDate, durationDays, done: initial.done });
  };

  return (
    <div className="sticky left-0 z-10 max-w-full sm:w-fit">
      <form
        onSubmit={handleSubmit}
        className="my-1 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
      >
        <div>
          <label htmlFor="task-name" className={labelCls}>
            Task
          </label>
          <input
            id="task-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Take-off"
            className={`${fieldCls} w-40`}
          />
        </div>
        <div>
          <label htmlFor="task-start" className={labelCls}>
            Start
          </label>
          <input
            id="task-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={fieldCls}
          />
        </div>
        <div>
          <label htmlFor="task-days" className={labelCls}>
            Days
          </label>
          <input
            id="task-days"
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className={`${fieldCls} w-16`}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          {onDelete && (
            <Button type="button" variant="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
        {error && <p className="w-full text-xs font-medium text-red-600">{error}</p>}
      </form>
    </div>
  );
}
