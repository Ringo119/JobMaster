import { createHashRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { JobRegisterPage } from './pages/JobRegisterPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { PlannerPage } from './pages/PlannerPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailsPage } from './pages/ClientDetailsPage';
import { InvoicePage } from './pages/InvoicePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CalendarPage } from './pages/CalendarPage';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'jobs', element: <JobRegisterPage /> },
      { path: 'jobs/new', element: <JobDetailsPage /> },
      { path: 'jobs/:id', element: <JobDetailsPage /> },
      { path: 'planner', element: <PlannerPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:id', element: <ClientDetailsPage /> },
      // The invoice register and payments screens are parked for now (their
      // sidebar entries are greyed out); the invoice document stays reachable
      // from Job Details, reminders and search.
      { path: 'invoices/:id', element: <InvoicePage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
