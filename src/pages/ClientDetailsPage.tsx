import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { formatUK } from '../lib/dates';
import { useClient, useUpdateClient } from '../hooks/useClients';
import { useJobsByClient } from '../hooks/useJobs';
import { useInvoicesByClient } from '../hooks/useInvoices';
import { clientFormSchema, type Client, type ClientFormValues } from '../data/models/client';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700';
const errorClass = 'mt-1 text-xs text-red-600';

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">
        {value === undefined || value === null || value === '' ? '—' : value}
      </dd>
    </div>
  );
}

function EditClientForm({ client, onDone }: { client: Client; onDone: () => void }) {
  const updateClient = useUpdateClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client.name,
      contact: client.contact,
      email: client.email,
      phone: client.phone,
      address: client.address,
      paymentTermsDays: client.paymentTermsDays,
    },
  });

  const onSubmit = async (values: ClientFormValues) => {
    await updateClient.mutateAsync({ id: client.id, patch: values });
    onDone();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="name">
            Name
          </label>
          <input id="name" className={inputClass} {...register('name')} />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="contact">
            Contact
          </label>
          <input id="contact" className={inputClass} {...register('contact')} />
        </div>

        <div>
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <input id="email" type="email" className={inputClass} {...register('email')} />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="phone">
            Phone
          </label>
          <input id="phone" className={inputClass} {...register('phone')} />
        </div>

        <div>
          <label className={labelClass} htmlFor="paymentTermsDays">
            Payment terms (days)
          </label>
          <input
            id="paymentTermsDays"
            type="number"
            className={inputClass}
            {...register('paymentTermsDays', { valueAsNumber: true })}
          />
          {errors.paymentTermsDays && (
            <p className={errorClass}>{errors.paymentTermsDays.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="address">
            Address
          </label>
          <textarea id="address" rows={2} className={inputClass} {...register('address')} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [editing, setEditing] = useState(false);

  const { data: client, isLoading } = useClient(id);
  const { data: jobs } = useJobsByClient(id);
  const { data: invoices } = useInvoicesByClient(id);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Client" />
        <Card className="p-8 text-center text-sm text-slate-500">Loading client…</Card>
      </div>
    );
  }

  if (!client) {
    return (
      <div>
        <PageHeader title="Client not found" />
        <Card className="p-8 text-center text-sm text-slate-500">
          <p>That client could not be found.</p>
          <Link to="/clients" className="mt-3 inline-block text-brand-600 hover:text-brand-700">
            ← Back to clients
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/clients" className="text-sm text-brand-600 hover:text-brand-700">
          ← Back to clients
        </Link>
      </div>

      <PageHeader
        title={client.name}
        actions={
          !editing && (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )
        }
      />

      <Card className="mb-6 p-5">
        {editing ? (
          <EditClientForm client={client} onDone={() => setEditing(false)} />
        ) : (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow label="Contact" value={client.contact} />
            <DetailRow label="Email" value={client.email} />
            <DetailRow label="Phone" value={client.phone} />
            <DetailRow
              label="Payment terms"
              value={
                client.paymentTermsDays !== undefined
                  ? `${client.paymentTermsDays} days`
                  : undefined
              }
            />
            <div className="sm:col-span-2">
              <DetailRow label="Address" value={client.address} />
            </div>
          </dl>
        )}
      </Card>

      <Card className="mb-6 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-semibold text-slate-800">Jobs</h2>
        </div>
        {!jobs || jobs.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">No jobs for this client yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Job</th>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Return</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-3">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="font-medium text-brand-600 hover:text-brand-700"
                    >
                      #{job.jobNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    <div>{job.project || '—'}</div>
                    {job.description && (
                      <div className="text-xs text-slate-500">{job.description}</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-700">{formatUK(job.returnDate) || '—'}</td>
                  <td className="px-5 py-3">
                    <StatusBadge job={job} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-semibold text-slate-800">Invoices</h2>
        </div>
        {!invoices || invoices.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            No invoices yet (Phase 2).
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="px-5 py-3 text-sm text-slate-700">
                {invoice.id}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
