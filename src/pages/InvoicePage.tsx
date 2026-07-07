import { Link, useParams } from 'react-router-dom';
import { useInvoice, useMarkInvoiceSent, useMarkInvoicePaid } from '../hooks/useInvoices';
import { useJob } from '../hooks/useJobs';
import { useClient } from '../hooks/useClients';
import { useSettings } from '../hooks/useSettings';
import { formatGBP } from '../lib/currency';
import { formatUK } from '../lib/dates';
import { formatVatRate } from '../lib/vat';
import { visualInvoiceStatus, INVOICE_STATUS_STYLES } from '../lib/invoiceStatus';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function InvoicePage() {
  const { id } = useParams<{ id: string }>();

  const { data: invoice, isLoading } = useInvoice(id);
  const { data: job } = useJob(invoice?.jobId);
  const { data: client } = useClient(invoice?.clientId);
  const { data: settings } = useSettings();

  const markSent = useMarkInvoiceSent();
  const markPaid = useMarkInvoicePaid();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Invoice" />
        <Card className="p-8 text-center text-sm text-slate-500">Loading invoice…</Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div>
        <PageHeader title="Invoice not found" />
        <Card className="p-8 text-center text-sm text-slate-500">
          <p>That invoice could not be found.</p>
          <Link
            to="/invoices"
            className="mt-3 inline-block text-brand-600 hover:text-brand-700"
          >
            ← Back to invoices
          </Link>
        </Card>
      </div>
    );
  }

  const vis = visualInvoiceStatus(invoice);
  const statusStyles = INVOICE_STATUS_STYLES[vis];

  const lineDescription = [job?.project, job?.description]
    .filter((part) => part && part.trim())
    .join(' — ');

  const emailSubject = `Invoice ${invoice.invoiceNumber}`;
  const emailBody =
    `Dear ${client?.name ?? 'Sir/Madam'},\n\n` +
    `Please find invoice ${invoice.invoiceNumber} for ${formatGBP(invoice.grossTotalPence)}` +
    `${invoice.dueDate ? `, due ${formatUK(invoice.dueDate)}` : ''}.\n\n` +
    `Kind regards,\n${settings?.businessName ?? ''}`;
  const mailtoHref = `mailto:${client?.email ?? ''}?subject=${encodeURIComponent(
    emailSubject,
  )}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/invoices" className="text-sm text-brand-600 hover:text-brand-700">
            ← Back to invoices
          </Link>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles.badge}`}
          >
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusStyles.dot}`} />
            {statusStyles.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => window.print()}>
            Print / Save PDF
          </Button>
          <a
            href={mailtoHref}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-surface px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Email Client
          </a>
          {invoice.status === 'draft' && (
            <Button
              variant="secondary"
              disabled={markSent.isPending}
              onClick={() => markSent.mutateAsync(invoice.id)}
            >
              {markSent.isPending ? 'Marking…' : 'Mark Sent'}
            </Button>
          )}
          {invoice.status !== 'paid' && (
            <Button
              variant="secondary"
              disabled={markPaid.isPending}
              onClick={() => markPaid.mutateAsync(invoice.id)}
            >
              {markPaid.isPending ? 'Marking…' : 'Mark Paid'}
            </Button>
          )}
        </div>
      </div>

      <Card className="invoice-doc mx-auto max-w-3xl p-8">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            {settings?.logoDataUrl && (
              <img
                src={settings.logoDataUrl}
                alt={settings.businessName ?? 'Business logo'}
                className="mb-3 max-h-16 w-auto"
              />
            )}
            <h2 className="text-2xl font-bold text-slate-900">
              {settings?.businessName ?? ''}
            </h2>
            {settings?.address && (
              <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                {settings.address}
              </p>
            )}
            {settings?.vatNumber && (
              <p className="mt-1 text-sm text-slate-600">VAT No: {settings.vatNumber}</p>
            )}
          </div>

          <div className="text-right">
            <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
              Invoice
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {invoice.invoiceNumber}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Date issued: {formatUK(invoice.dateIssued)}
            </p>
            {invoice.dueDate && (
              <p className="text-sm text-slate-600">Due: {formatUK(invoice.dueDate)}</p>
            )}
          </div>
        </div>

        <div className="py-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bill to
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-900">{client?.name ?? ''}</p>
          {client?.address && (
            <p className="whitespace-pre-line text-sm text-slate-600">{client.address}</p>
          )}
          {client?.email && <p className="text-sm text-slate-600">{client.email}</p>}
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-4 font-semibold">Description</th>
              <th className="py-2 pl-4 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-3 pr-4 text-slate-700">{lineDescription || '—'}</td>
              <td className="py-3 pl-4 text-right text-slate-700">
                {formatGBP(invoice.netTotalPence)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="py-2 pr-4 text-right text-slate-600">Net</td>
              <td className="py-2 pl-4 text-right text-slate-700">
                {formatGBP(invoice.netTotalPence)}
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-right text-slate-600">
                VAT{job ? ` (${formatVatRate(job.vatRate)})` : ''}
              </td>
              <td className="py-2 pl-4 text-right text-slate-700">
                {formatGBP(invoice.vatTotalPence)}
              </td>
            </tr>
            <tr className="border-t border-slate-300">
              <td className="py-3 pr-4 text-right text-base font-bold text-slate-900">
                TOTAL
              </td>
              <td className="py-3 pl-4 text-right text-base font-bold text-slate-900">
                {formatGBP(invoice.grossTotalPence)}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
}
