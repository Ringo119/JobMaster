# Job Master

*Plan. Manage. Invoice. Get paid.*

The all-in-one app to plan jobs, track progress, manage clients, create invoices and
get paid — a job-planning and invoicing app for a quantity surveyor / estimator,
replacing two Excel spreadsheets (a Gantt-style work programme and a job/invoice
register) with a single tool. Design principle: *"Excel, but it updates itself and
tells me what's due."*

**Current version: v3.0.**

## Running it

```bash
npm install
npm run dev      # start the dev server (Vite) at http://localhost:5173
npm run build    # typecheck + production build
npm run preview  # preview the production build
```

The app seeds itself with demo data on first run (real example clients/jobs:
Gillespie, Taylor & Sons, Monument, A1 Construction). Use **Settings → Reset demo
data** to wipe and reseed.

## Tech stack

- **React 18 + TypeScript + Vite**
- **React Router v6** — sidebar navigation across screens
- **Dexie (IndexedDB)** — local, no-account persistence
- **TanStack Query** — data fetching/caching; mutations invalidate shared queries so
  every screen stays in sync automatically
- **React Hook Form + Zod** — forms and the single source-of-truth data model
- **date-fns** — UK date handling; **Tailwind CSS** — styling

### Architecture: the backend swap point

All data access goes through repository interfaces in
`src/data/repositories/types.ts`. The UI only ever imports the hooks in `src/hooks`,
never Dexie directly. To move to a Supabase/Firebase backend, provide new repository
implementations and re-point `src/data/repositories/index.ts` — no screen needs to
change. Money is stored as integer **pence**; dates as ISO strings formatted to UK
`dd/MM/yyyy` only at the display edge.

## What's built

### v1.0 — planning
- **Dashboard**, **Job Register**, **Job Details** (live Net/VAT/Total preview, ASAP),
  **Programme Planner** (CSS-grid Gantt), **Clients**, **Settings**.

### v2.0 — invoicing & money
- **Create Invoice** from a job (auto number, VAT from the fee, due date from client
  terms), printable **Invoice document**, **Invoice Register** (traffic-light status),
  **Payments**, **Reports**, and live Dashboard money tiles. Status automation: invoice
  created → job *Invoiced*; marked paid → job *Paid*.

### v3.0 — scheduling, reminders & documents
- **Calendar** — monthly view of jobs by return date, with an ASAP/unscheduled strip.
- **Drag-to-reschedule** — drag a bar on the Planner to shift a job's dates; persists
  immediately (a plain click still opens the job).
- **Reminders** — a bell in the top bar surfacing overdue/ASAP/due-soon jobs and
  overdue/due-soon invoices, with optional best-effort desktop notifications.
- **Per-job Documents** — attach tenders, drawings, BoQs, quotes and files to a job
  (stored locally in IndexedDB), with download and remove.
- **Email Client** — the invoice opens a pre-filled email via `mailto:`.

## Deferred / future

A hosted backend (Supabase) for multi-device sync and real email automation; the
repository seam keeps that a localized change. PDF is handled via the browser's
"Save as PDF" on the invoice document.

## Project layout

```
src/
  data/
    models/         Zod schemas + types (the data model)
    repositories/   interfaces + Dexie implementations (backend swap point)
    db.ts, seed.ts  Dexie database (v2: + documents) + demo data
  hooks/            TanStack Query hooks wrapping the repositories
  lib/              currency, dates, VAT, job/invoice status, reminders, notify
  components/       layout (sidebar, reminders bell) + shared UI + job widgets
  pages/            one component per screen
```
