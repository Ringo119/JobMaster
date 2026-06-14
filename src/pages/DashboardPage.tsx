import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, StatCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useJobs } from '../hooks/useJobs';
import { useClients } from '../hooks/useClients';
import { formatUK, isDueWithin, isOverdue, daysUntil } from '../lib/dates';
import { visualStatus } from '../lib/jobStatus';
import type { Job } from '../data/models/job';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: jobs, isLoading } = useJobs();
  const { data: clients } = useClients();

  const clientNames = new Map((clients ?? []).map((c) => [c.id, c.name]));

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Good morning, David" subtitle="Here's where things stand today." />
        <Card className="p-8 text-center text-sm text-slate-500">Loading your day…</Card>
      </div>
    );
  }

  const allJobs = jobs ?? [];

  const dueThisWeek = allJobs.filter((j) => {
    const done =
      j.status === 'submitted' || j.status === 'invoiced' || j.status === 'paid';
    return !done && isDueWithin(j.returnDate, 7);
  }).length;

  const overdueCount = allJobs.filter((j) => visualStatus(j) === 'overdue').length;
  const activeCount = allJobs.filter((j) => j.status !== 'paid').length;
  const clientCount = clients?.length ?? 0;

  const isUrgent = (j: Job): boolean =>
    j.isAsap || isOverdue(j.returnDate) || isDueWithin(j.returnDate, 3);

  // Sort soonest first. ASAP / overdue float to the top.
  const urgentSortKey = (j: Job): number => {
    if (j.isAsap) return -1000;
    const d = daysUntil(j.returnDate);
    return d ?? Number.MAX_SAFE_INTEGER;
  };

  const urgentJobs = allJobs
    .filter(isUrgent)
    .sort((a, b) => urgentSortKey(a) - urgentSortKey(b));

  return (
    <div>
      <PageHeader
        title="Good morning, David"
        subtitle="Here's where things stand today."
        actions={
          <Button variant="primary" onClick={() => navigate('/jobs/new')}>
            + New Job
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Jobs Due This Week" value={dueThisWeek} />
        <StatCard
          label="Jobs Overdue"
          value={overdueCount}
          accent={overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}
        />
        <StatCard label="Active Jobs" value={activeCount} />
        <StatCard label="Clients" value={clientCount} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Invoices Outstanding"
          value={<span className="text-slate-400">£0</span>}
          accent="text-slate-400"
        />
        <Card className="flex items-center p-4 text-sm text-slate-400">
          Payments &amp; invoicing land in Phase 2.
        </Card>
      </div>

      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Urgent Jobs</h2>
        {urgentJobs.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing urgent — enjoy the calm. ☕</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {urgentJobs.map((job) => (
              <li key={job.id}>
                <Link
                  to={`/jobs/${job.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span aria-hidden className="text-amber-500">
                      ⚠
                    </span>
                    <span className="min-w-0">
                      <span className="font-medium text-slate-800">
                        {clientNames.get(job.clientId) ?? 'Unknown client'}
                      </span>
                      {job.project && (
                        <span className="ml-2 truncate text-slate-500">{job.project}</span>
                      )}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-sm font-medium ${
                      job.isAsap || isOverdue(job.returnDate)
                        ? 'text-red-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {job.isAsap ? 'ASAP' : formatUK(job.returnDate)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link to="/jobs/new">
          <Button variant="primary">New Job</Button>
        </Link>
        <Link to="/planner">
          <Button variant="secondary">Planner</Button>
        </Link>
        <Link to="/clients">
          <Button variant="secondary">Clients</Button>
        </Link>
      </div>
    </div>
  );
}
