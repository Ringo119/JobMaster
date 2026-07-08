import type { TaskStatus } from '../data/models/task';
import { TASK_STATUS_LABELS } from '../data/models/task';

/**
 * Tailwind classes for task/board colour coding, mirroring STATUS_STYLES in
 * ./jobStatus. Slate = waiting, violet = in progress (continuity with the old
 * all-violet task bars), green = done.
 */
export const TASK_STATUS_STYLES: Record<
  TaskStatus,
  { bar: string; dot: string; badge: string; label: string }
> = {
  todo: {
    bar: 'bg-slate-400',
    dot: 'bg-slate-400',
    badge: 'bg-slate-200 text-slate-700',
    label: TASK_STATUS_LABELS.todo,
  },
  doing: {
    bar: 'bg-violet-500',
    dot: 'bg-violet-500',
    badge: 'bg-violet-100 text-violet-800',
    label: TASK_STATUS_LABELS.doing,
  },
  done: {
    bar: 'bg-green-500',
    dot: 'bg-green-500',
    badge: 'bg-green-100 text-green-800',
    label: TASK_STATUS_LABELS.done,
  },
};
