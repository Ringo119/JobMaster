import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  type JobStatus,
} from '../data/models/job';
import type { NewJob } from '../data/repositories/types';
import { useJob, useCreateJob, useUpdateJob } from '../hooks/useJobs';
import { useClients } from '../hooks/useClients';
import { useSettings } from '../hooks/useSettings';
import { parsePoundsToPence, penceToPounds, formatGBP } from '../lib/currency';
import { computeVat, formatVatRate } from '../lib/vat';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const VAT_OPTIONS = [0.2, 0.05, 0] as const;

interface FormState {
  clientId: string;
  project: string;
  description: string;
  fee: string;
  vatRate: number;
  status: JobStatus;
  startDate: string;
  returnDate: string;
  isAsap: boolean;
  estimatedDays: string;
  notes: string;
}

const blankForm = (vatRate: number): FormState => ({
  clientId: '',
  project: '',
  description: '',
  fee: '',
  vatRate,
  status: 'planning',
  startDate: '',
  returnDate: '',
  isAsap: false,
  estimatedDays: '',
  notes: '',
});

const labelCls = 'block text-sm font-medium text-slate-700';
const inputCls =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 disabled:bg-slate-100 disabled:text-slate-400';

export function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: job } = useJob(id);
  const { data: clients } = useClients();
  const { data: settings } = useSettings();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();

  const [form, setForm] = useState<FormState>(() => blankForm(0.2));
  const [error, setError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  // Populate the form once data is available (existing job, or settings default for new jobs).
  useEffect(() => {
    if (seeded) return;
    if (isEdit) {
      if (!job) return;
      setForm({
        clientId: job.clientId,
        project: job.project ?? '',
        description: job.description ?? '',
        fee: String(penceToPounds(job.feeNetPence)),
        vatRate: job.vatRate,
        status: job.status,
        startDate: job.startDate ?? '',
        returnDate: job.returnDate ?? '',
        isAsap: job.isAsap,
        estimatedDays: job.estimatedDays != null ? String(job.estimatedDays) : '',
        notes: job.notes ?? '',
      });
      setSeeded(true);
    } else {
      if (!settings) return;
      setForm(blankForm(settings.defaultVatRate));
      setSeeded(true);
    }
  }, [isEdit, job, settings, seeded]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const vat = useMemo(
    () => computeVat(parsePoundsToPence(form.fee), form.vatRate),
    [form.fee, form.vatRate],
  );

  const clientName = useMemo(
    () => clients?.find((c) => c.id === form.clientId)?.name,
    [clients, form.clientId],
  );

  const isSaving = createJob.isPending || updateJob.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.clientId) {
      setError('Please choose a client.');
      return;
    }
    const feePence = parsePoundsToPence(form.fee);
    if (form.fee.trim() === '' || feePence < 0 || Number.isNaN(feePence)) {
      setError('Fee must be a non-negative number.');
      return;
    }

    const estimatedDays = form.estimatedDays.trim()
      ? Number.parseInt(form.estimatedDays, 10)
      : undefined;

    const payload: NewJob = {
      clientId: form.clientId,
      project: form.project.trim() || undefined,
      description: form.description.trim() || undefined,
      feeNetPence: feePence,
      vatRate: form.vatRate,
      status: form.status,
      startDate: form.startDate || null,
      returnDate: form.isAsap ? null : form.returnDate || null,
      isAsap: form.isAsap,
      estimatedDays:
        estimatedDays != null && !Number.isNaN(estimatedDays) ? estimatedDays : undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      if (isEdit && id) {
        await updateJob.mutateAsync({ id, patch: payload });
      } else {
        await createJob.mutateAsync(payload);
      }
      navigate('/jobs');
    } catch {
      setError('Something went wrong while saving. Please try again.');
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? `Job #${job?.jobNumber ?? ''}` : 'New Job'}
        subtitle={clientName ?? (isEdit ? undefined : 'Capture a new job for a client.')}
        actions={
          <Link to="/planner">
            <Button variant="secondary">View on Planner</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 p-5">
            <div>
              <label htmlFor="clientId" className={labelCls}>
                Client
              </label>
              <select
                id="clientId"
                value={form.clientId}
                onChange={(e) => set('clientId', e.target.value)}
                className={inputCls}
              >
                <option value="">Select a client…</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="project" className={labelCls}>
                  Project
                </label>
                <input
                  id="project"
                  type="text"
                  value={form.project}
                  onChange={(e) => set('project', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="description" className={labelCls}>
                  Description
                </label>
                <input
                  id="description"
                  type="text"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fee" className={labelCls}>
                  Fee (net, £)
                </label>
                <input
                  id="fee"
                  type="text"
                  inputMode="decimal"
                  value={form.fee}
                  onChange={(e) => set('fee', e.target.value)}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="vatRate" className={labelCls}>
                  VAT rate
                </label>
                <select
                  id="vatRate"
                  value={form.vatRate}
                  onChange={(e) => set('vatRate', Number(e.target.value))}
                  className={inputCls}
                >
                  {VAT_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {formatVatRate(r)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className={labelCls}>Status</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {JOB_STATUSES.map((s) => {
                  const active = form.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set('status', s)}
                      className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                        active
                          ? 'border-transparent bg-brand-600 text-white'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {JOB_STATUS_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className={labelCls}>
                  Start date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set('startDate', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="returnDate" className={labelCls}>
                  Return date
                </label>
                <input
                  id="returnDate"
                  type="date"
                  value={form.returnDate}
                  onChange={(e) => set('returnDate', e.target.value)}
                  disabled={form.isAsap}
                  className={inputCls}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.isAsap}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    isAsap: e.target.checked,
                    returnDate: e.target.checked ? '' : f.returnDate,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
              />
              ASAP (urgent, no fixed return date)
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="estimatedDays" className={labelCls}>
                  Estimated days
                </label>
                <input
                  id="estimatedDays"
                  type="number"
                  min={0}
                  value={form.estimatedDays}
                  onChange={(e) => set('estimatedDays', e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className={labelCls}>
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                className={inputCls}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-500">Fee breakdown</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Net</dt>
                <dd className="font-medium text-slate-800">{formatGBP(vat.netPence)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">VAT ({formatVatRate(form.vatRate)})</dt>
                <dd className="font-medium text-slate-800">{formatGBP(vat.vatPence)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <dt className="font-semibold text-slate-700">Total</dt>
                <dd className="text-base font-semibold text-slate-900">
                  {formatGBP(vat.grossPence)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="space-y-3 p-5">
            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create job'}
            </Button>
            <div>
              <Button type="button" variant="secondary" disabled className="w-full">
                Create Invoice
              </Button>
              <p className="mt-1 text-center text-xs text-slate-400">Phase 2</p>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
