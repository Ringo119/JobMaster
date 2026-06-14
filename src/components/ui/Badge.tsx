import type { Job } from '../../data/models/job';
import { STATUS_STYLES, visualStatus } from '../../lib/jobStatus';

export function StatusBadge({ job }: { job: Job }) {
  const status = visualStatus(job);
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}
    >
      {style.label}
    </span>
  );
}
