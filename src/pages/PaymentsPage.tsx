import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, StatCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useInvoices, useMarkInvoicePaid } from '../hooks/useInvoices';
import { useJobs } from '../hooks/useJobs';
import { useClients } from '../hooks/useClients';
import { formatGBP } from '../lib/currency';
import { formatUK, isOverdue, daysUntil } from '../lib/dates';
import {
  visualInvoiceStatus,
  INVOICE_STATUS_STYLES,
  isOutstanding,
} from '../lib/invoiceStatus';
import type { Invoice } from '../data/models/invoice';
import type { Job } from '../data/models/job';

export function PaymentsPage() {
  const { data: invoices, isLoading } = useInvoices();
  const { data: clients } = useClients();
  const { data: jobs } = useJobs();
  const markPaid = useMarkInvoicePaid();

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of clients ?? []) map.set(c.id, c.name);
    return map;
  }, [clients]);

  const jobById = useMemo(() => {
    const map = new Map<string, Job>();
    for (const j of jobs ?? []) map.set(j.id, j);
    return map;
  }, [jobs]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Payments" subtitle="Outstanding invoices awaiting payment." />
        <Card className="p-8 text-center text-sm text-slate-500">Loading payments…</Card>
      </div>
    );
  }

  const all = invoices ?? [];

  const projectFor = (inv: Invoice): string => jobById.get(inv.jobId)?.project ?? '';
  const clientFor = (inv: Invoice): string =>
    clientNameById.get(inv.clientId) ?? 'Unknown client';

  const outstanding = all
    .filter(isOutstanding)
    .sort((a, b) => {
      const da = daysUntil(a.dueDate);
      const db = daysUntil(b.dueDate);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });

  const paid = all.filter((inv) => inv.status === 'paid');

  const outstandingTotal = outstanding.reduce((sum, inv) => sum + inv.grossTotalPence, 0);
  const overdueTotal = outstanding
    .filter((inv) => isOverdue(inv.dueDate))
    .reduce((sum, inv) => sum + inv.grossTotalPence, 0);

  const handleMarkPaid = (id: string) => {
    void markPaid.mutateAsync(id);
  };

  return (
    <div>
      <PageHeader title="Payments" subtitle="Outstanding invoices awaiting payment." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding total" value={formatGBP(outstandingTotal)} />
        <StatCard
          label="Overdue total"
          value={formatGBP(overdueTotal)}
          accent={overdueTotal > 0 ? 'text-red-600' : 'text-slate-900'}
        />
        <StatCard label="Invoices outstanding" value={outstanding.length} />
      </div>

      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Outstanding</h2>
        {outstanding.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing outstanding — all paid up. 🎉</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {outstanding.map((inv) => {
              const vis = visualInvoiceStatus(inv);
              const style = INVOICE_STATUS_STYLES[vis];
              const overdue = isOverdue(inv.dueDate);
              return (
                <li
                  key={inv.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="font-medium text-slate-800 hover:underline"
                    >
                      {clientFor(inv)}
                    </Link>
                    {projectFor(inv) && (
                      <span className="ml-2 truncate text-sm text-slate-500">
                        {projectFor(inv)}
                      </span>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${style.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
                        {style.label}
                      </span>
                      {inv.dueDate && (
                        <span className={overdue ? 'text-red-600' : 'text-slate-500'}>
                          Due {formatUK(inv.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-base font-semibold text-slate-900">
                      {formatGBP(inv.grossTotalPence)}
                    </span>
                    <Button
                      variant="primary"
                      disabled={markPaid.isPending}
                      onClick={() => handleMarkPaid(inv.id)}
                    >
                      Mark Paid
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {paid.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Recently paid</h2>
          <ul className="divide-y divide-slate-100">
            {paid.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    to={`/invoices/${inv.id}`}
                    className="font-medium text-slate-700 hover:underline"
                  >
                    {clientFor(inv)}
                  </Link>
                  {projectFor(inv) && (
                    <span className="ml-2 truncate text-sm text-slate-500">
                      {projectFor(inv)}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-sm font-medium text-slate-600">
                  {formatGBP(inv.grossTotalPence)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
