import { useEffect } from 'react';
import { useJob } from '../../hooks/useJobs';
import { useClients } from '../../hooks/useClients';
import { KanbanBoard } from './KanbanBoard';

/**
 * Full-screen overlay hosting a job's kanban board — opened from the Planner
 * or Job Register without navigating away. Closes on ✕, backdrop click or
 * Escape.
 */
export function BoardModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const { data: job, isLoading } = useJob(jobId);
  const { data: clients } = useClients();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const clientName = job
    ? (clients ?? []).find((c) => c.id === job.clientId)?.name ?? 'Unknown client'
    : '';

  const title = job
    ? `${clientName} · #${job.jobNumber}${job.project ? ` · ${job.project}` : ''}`
    : 'Job board';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={job ? `Task board for ${title}` : 'Task board'}
      onClick={(e) => {
        // Backdrop only — clicks inside the panel don't bubble here as target.
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="animate-panel flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-slate-200 bg-surface p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Board — drag cards between columns
            </p>
          </div>
          <button
            type="button"
            aria-label="Close board"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-slate-500">Loading…</p>
          ) : !job ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Job not found — it may have been deleted.
            </p>
          ) : (
            <KanbanBoard jobId={jobId} />
          )}
        </div>
      </div>
    </div>
  );
}
