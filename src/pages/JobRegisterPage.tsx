import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  type JobStatus,
} from '../data/models/job';
import { useJobs } from '../hooks/useJobs';
import { useClients } from '../hooks/useClients';
import { formatGBP } from '../lib/currency';
import { formatUK } from '../lib/dates';
import { StatusBadge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

type StatusFilter = JobStatus | 'all';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...JOB_STATUSES.map((s) => ({ value: s, label: JOB_STATUS_LABELS[s] })),
];

export function JobRegisterPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const { data: jobs, isLoading } = useJobs({ search, status });
  const { data: clients } = useClients();

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of clients ?? []) map.set(c.id, c.name);
    return map;
  }, [clients]);

  return (
    <div>
      <PageHeader
        title="Job Register"
        subtitle="Every job, replacing the spreadsheet list."
        actions={
          <Link to="/jobs/new">
            <Button>+ New Job</Button>
          </Link>
        }
      />

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 sm:max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = status === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatus(f.value)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                    active
                      ? 'border-transparent bg-brand-600 text-white'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Return</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Loading jobs…
                  </td>
                </tr>
              )}

              {!isLoading && (jobs?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No jobs found.{' '}
                    <Link to="/jobs/new" className="font-medium text-brand-600 hover:underline">
                      Create one
                    </Link>
                    .
                  </td>
                </tr>
              )}

              {!isLoading &&
                jobs?.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="font-medium text-brand-600 hover:underline"
                      >
                        #{job.jobNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {clientNameById.get(job.clientId) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{job.project || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{job.description || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{formatGBP(job.feeNetPence)}</td>
                    <td className="px-4 py-3">
                      {job.isAsap ? (
                        <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                          ASAP
                        </span>
                      ) : (
                        <span className="text-slate-700">{formatUK(job.returnDate) || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge job={job} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
