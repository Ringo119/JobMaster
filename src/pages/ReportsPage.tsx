import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, StatCard } from '../components/ui/Card';
import { useInvoices } from '../hooks/useInvoices';
import { useJobs } from '../hooks/useJobs';
import { useClients } from '../hooks/useClients';
import { formatGBP } from '../lib/currency';
import { isOutstanding } from '../lib/invoiceStatus';
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  type JobStatus,
} from '../data/models/job';
import type { Invoice } from '../data/models/invoice';

type ClientRow = { clientId: string; name: string; count: number; totalPence: number };
type MonthRow = { key: string; label: string; totalPence: number };

export function ReportsPage() {
  const { data: invoices, isLoading } = useInvoices();
  const { data: clients } = useClients();
  const { data: jobs } = useJobs();

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of clients ?? []) map.set(c.id, c.name);
    return map;
  }, [clients]);

  const all = useMemo<Invoice[]>(() => invoices ?? [], [invoices]);

  const totalInvoiced = all.reduce((s, inv) => s + inv.grossTotalPence, 0);
  const paidTotal = all
    .filter((inv) => inv.status === 'paid')
    .reduce((s, inv) => s + inv.grossTotalPence, 0);
  const outstandingTotal = all
    .filter(isOutstanding)
    .reduce((s, inv) => s + inv.grossTotalPence, 0);
  const vatTotal = all.reduce((s, inv) => s + inv.vatTotalPence, 0);

  const clientRows = useMemo<ClientRow[]>(() => {
    const map = new Map<string, ClientRow>();
    for (const inv of all) {
      const existing = map.get(inv.clientId);
      if (existing) {
        existing.count += 1;
        existing.totalPence += inv.grossTotalPence;
      } else {
        map.set(inv.clientId, {
          clientId: inv.clientId,
          name: clientNameById.get(inv.clientId) ?? 'Unknown client',
          count: 1,
          totalPence: inv.grossTotalPence,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.totalPence - a.totalPence);
  }, [all, clientNameById]);

  const monthRows = useMemo<MonthRow[]>(() => {
    const map = new Map<string, number>();
    for (const inv of all) {
      const key = inv.dateIssued.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + inv.grossTotalPence);
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, totalPence]) => ({
        key,
        label: format(parseISO(`${key}-01`), 'MMM yyyy'),
        totalPence,
      }));
  }, [all]);

  const maxClientTotal = clientRows.reduce((m, r) => Math.max(m, r.totalPence), 0);
  const maxMonthTotal = monthRows.reduce((m, r) => Math.max(m, r.totalPence), 0);

  const workload = useMemo(() => {
    const counts = new Map<JobStatus, number>();
    for (const j of jobs ?? []) counts.set(j.status, (counts.get(j.status) ?? 0) + 1);
    return JOB_STATUSES.map((status) => ({
      status,
      label: JOB_STATUS_LABELS[status],
      count: counts.get(status) ?? 0,
    }));
  }, [jobs]);

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Reports"
          subtitle="Turnover, outstanding money and workload at a glance."
        />
        <Card className="p-8 text-center text-sm text-slate-500">Crunching the numbers…</Card>
      </div>
    );
  }

  const pct = (value: number, max: number): string =>
    max > 0 ? `${Math.round((value / max) * 100)}%` : '0%';

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Turnover, outstanding money and workload at a glance."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total invoiced" value={formatGBP(totalInvoiced)} />
        <StatCard label="Paid" value={formatGBP(paidTotal)} accent="text-green-600" />
        <StatCard
          label="Outstanding"
          value={formatGBP(outstandingTotal)}
          accent={outstandingTotal > 0 ? 'text-amber-600' : 'text-slate-900'}
        />
        <StatCard label="VAT on invoices" value={formatGBP(vatTotal)} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Fees by client</h2>
          {clientRows.length === 0 ? (
            <p className="text-sm text-slate-500">No invoice data yet.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-2">Client</th>
                  <th className="pb-2 text-right">Invoices</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientRows.map((row) => (
                  <tr key={row.clientId}>
                    <td className="py-2 pr-3">
                      <div className="font-medium text-slate-800">{row.name}</div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-brand-600"
                          style={{ width: pct(row.totalPence, maxClientTotal) }}
                        />
                      </div>
                    </td>
                    <td className="py-2 text-right align-top text-slate-600">{row.count}</td>
                    <td className="py-2 text-right align-top font-medium text-slate-800">
                      {formatGBP(row.totalPence)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Monthly turnover</h2>
          {monthRows.length === 0 ? (
            <p className="text-sm text-slate-500">No invoice data yet.</p>
          ) : (
            <ul className="space-y-3">
              {monthRows.map((row) => (
                <li key={row.key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{row.label}</span>
                    <span className="font-medium text-slate-800">
                      {formatGBP(row.totalPence)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-brand-600"
                      style={{ width: pct(row.totalPence, maxMonthTotal) }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Workload</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {workload.map((w) => (
            <div key={w.status} className="rounded-lg border border-slate-200 p-3">
              <div className="text-sm font-medium text-slate-500">{w.label}</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">{w.count}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
