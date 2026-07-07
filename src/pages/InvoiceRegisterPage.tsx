import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Job } from '../data/models/job';
import { useInvoices } from '../hooks/useInvoices';
import { useJobs } from '../hooks/useJobs';
import { useClients } from '../hooks/useClients';
import { formatGBP } from '../lib/currency';
import { formatUK } from '../lib/dates';
import {
  visualInvoiceStatus,
  INVOICE_STATUS_STYLES,
  type VisualInvoiceStatus,
} from '../lib/invoiceStatus';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

type StatusFilter = VisualInvoiceStatus | 'all';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

export function InvoiceRegisterPage() {
  const [status, setStatus] = useState<StatusFilter>('all');

  const { data: invoices, isLoading } = useInvoices();
  const { data: clients } = useClients();
  const { data: jobs } = useJobs();

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

  const filtered = useMemo(() => {
    const list = invoices ?? [];
    if (status === 'all') return list;
    return list.filter((inv) => visualInvoiceStatus(inv) === status);
  }, [invoices, status]);

  return (
    <div>
      <PageHeader title="Invoices" subtitle="All invoices and their payment status." />

      <Card className="mb-4 p-4">
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
                    : 'border-slate-300 bg-surface text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Loading invoices…
                  </td>
                </tr>
              )}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title={status !== 'all' ? 'No invoices match' : 'No invoices yet'}
                      hint={
                        status !== 'all'
                          ? 'Try a different status filter.'
                          : 'Open a job and choose Create Invoice — the number, VAT and due date are filled in for you.'
                      }
                      action={
                        <Link
                          to="/jobs"
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          Go to jobs →
                        </Link>
                      }
                    />
                  </td>
                </tr>
              )}

              {!isLoading &&
                filtered.map((invoice) => {
                  const vis = visualInvoiceStatus(invoice);
                  const styles = INVOICE_STATUS_STYLES[vis];
                  const job = jobById.get(invoice.jobId);
                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className="font-medium text-brand-600 hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {clientNameById.get(invoice.clientId) ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{job?.project || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatUK(invoice.dateIssued) || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatUK(invoice.dueDate) || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatGBP(invoice.grossTotalPence)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`inline-block h-2.5 w-2.5 rounded-full ${styles.dot}`}
                          />
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}
                          >
                            {styles.label}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
