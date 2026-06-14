import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useClients, useCreateClient } from '../hooks/useClients';
import { clientFormSchema, type ClientFormValues } from '../data/models/client';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700';
const errorClass = 'mt-1 text-xs text-red-600';

export function ClientsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: clients, isLoading } = useClients(search);
  const createClient = useCreateClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = async (values: ClientFormValues) => {
    await createClient.mutateAsync(values);
    reset({ name: '' });
    setShowForm(false);
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Companies and contacts you invoice."
        actions={
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Cancel' : '+ New Client'}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-800">New client</h2>
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
                <textarea
                  id="address"
                  rows={2}
                  className={inputClass}
                  {...register('address')}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save client'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  reset({ name: '' });
                  setShowForm(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4">
        <input
          className={`${inputClass} max-w-sm`}
          placeholder="Search clients…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading clients…</div>
        ) : !clients || clients.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {search ? 'No clients match your search.' : 'No clients yet. Add your first one.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/clients/${client.id}`}
                      className="font-medium text-brand-600 hover:text-brand-700"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{client.contact || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{client.email || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{client.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
