import { useState } from 'react';
import type { JobTask, TaskStatus } from '../../data/models/task';
import { TASK_STATUSES, TASK_STATUS_LABELS, isTaskDone } from '../../data/models/task';
import {
  useTasksByJob,
  useCreateTask,
  useUpdateTask,
  useRemoveTask,
} from '../../hooks/useTasks';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { KanbanBoard } from '../board/KanbanBoard';

const dateInputCls =
  'rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-600 focus:border-brand-600 focus:outline-none';

type ViewMode = 'list' | 'board';

const VIEW_LABELS: Record<ViewMode, string> = {
  list: 'List',
  board: 'Board',
};

export function TasksCard({ jobId }: { jobId: string }) {
  const { data: tasks, isLoading } = useTasksByJob(jobId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const removeTask = useRemoveTask();

  const [title, setTitle] = useState('');
  const [view, setView] = useState<ViewMode>('list');

  const doneCount = (tasks ?? []).filter(isTaskDone).length;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await createTask.mutateAsync({
      jobId,
      title: trimmed,
      status: 'todo',
      startDate: null,
      endDate: null,
    });
    setTitle('');
  }

  function setDates(task: JobTask, patch: Partial<Pick<JobTask, 'startDate' | 'endDate'>>) {
    updateTask.mutate({ id: task.id, patch });
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Tasks</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Break the job into steps — dated tasks appear as bars on the Planner, and every
            job has a To Do / Doing / Done board.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {tasks && tasks.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {doneCount}/{tasks.length} done
            </span>
          )}
          <div className="flex rounded-lg border border-slate-300 p-0.5">
            {(Object.keys(VIEW_LABELS) as ViewMode[]).map((v) => (
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
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'board' ? (
        <div className="mt-4">
          <KanbanBoard jobId={jobId} />
        </div>
      ) : (
        <>
          <div className="mt-4">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : !tasks || tasks.length === 0 ? (
              <p className="text-sm text-slate-500">No tasks yet — add the first step below.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {tasks.map((task) => (
                  <li key={task.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={task.status === 'done'}
                        onChange={(e) =>
                          updateTask.mutate({
                            id: task.id,
                            patch: { status: e.target.checked ? 'done' : 'todo' },
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                      />
                      <span
                        className={`truncate text-sm ${
                          isTaskDone(task)
                            ? 'text-slate-400 line-through'
                            : 'font-medium text-slate-800'
                        }`}
                      >
                        {task.title}
                      </span>
                    </label>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <select
                        aria-label={`Status of task ${task.title}`}
                        value={task.status}
                        onChange={(e) =>
                          updateTask.mutate({
                            id: task.id,
                            patch: { status: e.target.value as TaskStatus },
                          })
                        }
                        className={dateInputCls}
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {TASK_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        aria-label="Task start date"
                        value={task.startDate ?? ''}
                        onChange={(e) => setDates(task, { startDate: e.target.value || null })}
                        className={dateInputCls}
                      />
                      <span className="text-xs text-slate-400">→</span>
                      <input
                        type="date"
                        aria-label="Task end date"
                        value={task.endDate ?? ''}
                        onChange={(e) => setDates(task, { endDate: e.target.value || null })}
                        className={dateInputCls}
                      />
                      <button
                        type="button"
                        aria-label={`Remove task ${task.title}`}
                        onClick={() => removeTask.mutate(task.id)}
                        className="ml-1 rounded px-1.5 py-0.5 text-sm text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleAdd} className="mt-3 flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a task, e.g. First fix electrical…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={createTask.isPending || !title.trim()}
            >
              Add
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}
