import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../../hooks/useJobs';
import { useClients } from '../../hooks/useClients';
import { useInvoices } from '../../hooks/useInvoices';
import { formatGBP } from '../../lib/currency';

const MAX_PER_GROUP = 5;

interface SearchHit {
  id: string;
  group: 'Jobs' | 'Clients' | 'Invoices';
  title: string;
  detail: string;
  to: string;
}

export function isMacLike(): boolean {
  return /Mac|iPhone|iPad/.test(navigator.platform ?? '');
}

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { data: jobs } = useJobs();
  const { data: clients } = useClients();
  const { data: invoices } = useInvoices();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset and focus whenever the palette opens.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Focus after the dialog renders.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const clientNames = useMemo(
    () => new Map((clients ?? []).map((c) => [c.id, c.name])),
    [clients],
  );

  const hits = useMemo((): SearchHit[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const contains = (...parts: (string | number | null | undefined)[]) =>
      parts.some((p) => p != null && String(p).toLowerCase().includes(q));

    const jobHits: SearchHit[] = (jobs ?? [])
      .filter((j) =>
        contains(j.jobNumber, j.project, j.description, clientNames.get(j.clientId)),
      )
      .slice(0, MAX_PER_GROUP)
      .map((j) => ({
        id: `job-${j.id}`,
        group: 'Jobs',
        title: `${clientNames.get(j.clientId) ?? 'Unknown'}${j.project ? ` — ${j.project}` : ''}`,
        detail: `#${j.jobNumber} · ${formatGBP(j.feeNetPence)}`,
        to: `/jobs/${j.id}`,
      }));

    const clientHits: SearchHit[] = (clients ?? [])
      .filter((c) => contains(c.name, c.contact, c.email))
      .slice(0, MAX_PER_GROUP)
      .map((c) => ({
        id: `client-${c.id}`,
        group: 'Clients',
        title: c.name,
        detail: c.contact || c.email || 'Client',
        to: `/clients/${c.id}`,
      }));

    const invoiceHits: SearchHit[] = (invoices ?? [])
      .filter((inv) => contains(inv.invoiceNumber, clientNames.get(inv.clientId)))
      .slice(0, MAX_PER_GROUP)
      .map((inv) => ({
        id: `invoice-${inv.id}`,
        group: 'Invoices',
        title: inv.invoiceNumber,
        detail: `${clientNames.get(inv.clientId) ?? 'Unknown'} · ${formatGBP(inv.grossTotalPence)}`,
        to: `/invoices/${inv.id}`,
      }));

    return [...jobHits, ...clientHits, ...invoiceHits];
  }, [query, jobs, clients, invoices, clientNames]);

  // Keep the active row in range as results change.
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, hits.length - 1)));
  }, [hits.length]);

  if (!open) return null;

  const select = (hit: SearchHit) => {
    onClose();
    navigate(hit.to);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (hits.length ? (i + 1) % hits.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (hits.length ? (i - 1 + hits.length) % hits.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = hits[activeIndex];
      if (hit) select(hit);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let lastGroup: SearchHit['group'] | null = null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[15vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className="animate-panel w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <span aria-hidden className="text-slate-400">
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search jobs, clients, invoices…"
            className="w-full bg-transparent py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
            Esc
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2">
          {query.trim() === '' ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              Type to search across jobs, clients and invoices.
            </p>
          ) : hits.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No matches for “{query.trim()}”.
            </p>
          ) : (
            <ul>
              {hits.map((hit, i) => {
                const showGroup = hit.group !== lastGroup;
                lastGroup = hit.group;
                return (
                  <li key={hit.id}>
                    {showGroup && (
                      <div className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {hit.group}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => select(hit)}
                      onMouseMove={() => setActiveIndex(i)}
                      className={`flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left text-sm transition ${
                        i === activeIndex ? 'bg-brand-50 text-brand-800' : 'text-slate-700'
                      }`}
                    >
                      <span className="min-w-0 truncate font-medium">{hit.title}</span>
                      <span className="shrink-0 text-xs text-slate-400">{hit.detail}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
