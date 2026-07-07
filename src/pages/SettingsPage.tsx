import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import { parsePoundsToPence, penceToPounds } from '../lib/currency';
import { resetDemoData } from '../data/seed';
import {
  ACCENTS,
  getAccent,
  getTheme,
  setAccent,
  setTheme,
  type Accent,
  type Theme,
} from '../lib/theme';
import type { Settings } from '../data/models/settings';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700';

type FormState = {
  businessName: string;
  address: string;
  vatNumber: string;
  invoicePrefix: string;
  defaultVatRate: number;
  hourlyRate: string;
};

function toFormState(s: Settings): FormState {
  return {
    businessName: s.businessName,
    address: s.address,
    vatNumber: s.vatNumber,
    invoicePrefix: s.invoicePrefix,
    defaultVatRate: s.defaultVatRate,
    hourlyRate:
      s.hourlyRatePence != null ? String(penceToPounds(s.hourlyRatePence)) : '',
  };
}

function AppearanceCard() {
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const [accent, setAccentState] = useState<Accent>(() => getAccent());

  const chooseTheme = (t: Theme) => {
    setTheme(t);
    setThemeState(t);
  };
  const chooseAccent = (a: Accent) => {
    setAccent(a);
    setAccentState(a);
  };

  return (
    <Card className="mb-6 p-5">
      <h2 className="mb-1 text-base font-semibold text-slate-800">Appearance</h2>
      <p className="mb-4 text-sm text-slate-500">
        Display preferences for this device.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">Theme</span>
          <div className="flex gap-2">
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => chooseTheme(t)}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                  theme === t
                    ? 'border-transparent bg-brand-600 text-white'
                    : 'border-slate-300 bg-surface text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t === 'light' ? '☀️ Light' : '🌙 Dark'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">Accent colour</span>
          <div className="flex gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                type="button"
                title={a.label}
                aria-label={`Accent: ${a.label}`}
                aria-pressed={accent === a.value}
                onClick={() => chooseAccent(a.value)}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  accent === a.value
                    ? 'border-slate-700 ring-2 ring-slate-300'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: a.swatch }}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function SettingsPage() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState | null>(null);
  const [saved, setSaved] = useState(false);

  // Hydrate the form once settings load.
  useEffect(() => {
    if (settings && form === null) {
      setForm(toFormState(settings));
    }
  }, [settings, form]);

  if (!settings || !form) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="Your business and invoicing details." />
        <Card className="p-8 text-center text-sm text-slate-500">Loading settings…</Card>
      </div>
    );
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedRate = form.hourlyRate.trim();
    const patch: Partial<Settings> = {
      businessName: form.businessName,
      address: form.address,
      vatNumber: form.vatNumber,
      invoicePrefix: form.invoicePrefix,
      defaultVatRate: form.defaultVatRate,
      hourlyRatePence: trimmedRate === '' ? undefined : parsePoundsToPence(trimmedRate),
    };
    await updateSettings.mutateAsync(patch);
    setSaved(true);
  };

  const onReset = async () => {
    const ok = window.confirm(
      'Reset all demo data? This replaces clients, jobs and settings with the seed data and cannot be undone.',
    );
    if (!ok) return;
    await resetDemoData();
    window.location.reload();
  };

  const invoicePreview = `${settings.invoicePrefix}-${String(settings.nextInvoiceSeq).padStart(
    4,
    '0',
  )}`;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your business and invoicing details." />

      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Business details</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="businessName">
                Business name
              </label>
              <input
                id="businessName"
                className={inputClass}
                value={form.businessName}
                onChange={(e) => set('businessName', e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="address">
                Address
              </label>
              <textarea
                id="address"
                rows={2}
                className={inputClass}
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="vatNumber">
                VAT number
              </label>
              <input
                id="vatNumber"
                className={inputClass}
                value={form.vatNumber}
                onChange={(e) => set('vatNumber', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="invoicePrefix">
                Invoice prefix
              </label>
              <input
                id="invoicePrefix"
                className={inputClass}
                value={form.invoicePrefix}
                onChange={(e) => set('invoicePrefix', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="defaultVatRate">
                Default VAT rate
              </label>
              <select
                id="defaultVatRate"
                className={inputClass}
                value={form.defaultVatRate}
                onChange={(e) => set('defaultVatRate', Number(e.target.value))}
              >
                <option value={0.2}>20%</option>
                <option value={0.05}>5%</option>
                <option value={0}>0%</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="hourlyRate">
                Hourly rate (£, optional)
              </label>
              <input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                placeholder="e.g. 65"
                value={form.hourlyRate}
                onChange={(e) => set('hourlyRate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Saving…' : 'Save settings'}
            </Button>
            {saved && <span className="text-sm font-medium text-green-600">Saved ✓</span>}
          </div>
        </form>
      </Card>

      <Card className="mb-6 p-5">
        <h2 className="mb-1 text-base font-semibold text-slate-800">Company logo</h2>
        <p className="mb-4 text-sm text-slate-500">
          Shown on your invoices. PNG or JPEG works best.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {settings.logoDataUrl ? (
            <img
              src={settings.logoDataUrl}
              alt="Company logo"
              className="max-h-16 w-auto rounded border border-slate-200 bg-surface p-1"
            />
          ) : (
            <span className="text-sm text-slate-400">No logo uploaded yet.</span>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => logoInputRef.current?.click()}
            >
              {settings.logoDataUrl ? 'Replace logo' : 'Upload logo'}
            </Button>
            {settings.logoDataUrl && (
              <Button
                type="button"
                variant="danger"
                onClick={() => updateSettings.mutate({ logoDataUrl: undefined })}
              >
                Remove
              </Button>
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const dataUrl = await readAsDataUrl(file);
              updateSettings.mutate({ logoDataUrl: dataUrl });
              e.target.value = '';
            }}
          />
        </div>
      </Card>

      <AppearanceCard />

      <Card className="mb-6 p-5">
        <h2 className="mb-3 text-base font-semibold text-slate-800">Numbering</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Next job number</dt>
            <dd className="font-medium text-slate-800">{settings.nextJobNumber}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Next invoice number</dt>
            <dd className="font-medium text-slate-800">{invoicePreview}</dd>
          </div>
        </dl>
      </Card>

      <Card className="border-red-200 p-5">
        <h2 className="mb-1 text-base font-semibold text-red-700">Danger zone</h2>
        <p className="mb-4 text-sm text-slate-600">
          Reset clears your changes and reloads the original demo clients, jobs and settings.
        </p>
        <Button type="button" variant="danger" onClick={onReset}>
          Reset demo data
        </Button>
      </Card>
    </div>
  );
}
