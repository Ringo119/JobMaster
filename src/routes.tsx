import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { JobRegisterPage } from './pages/JobRegisterPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { PlannerPage } from './pages/PlannerPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailsPage } from './pages/ClientDetailsPage';
import { InvoiceRegisterPage } from './pages/InvoiceRegisterPage';
import { InvoicePage } from './pages/InvoicePage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ComingSoonPage } from './pages/ComingSoonPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'jobs', element: <JobRegisterPage /> },
      { path: 'jobs/new', element: <JobDetailsPage /> },
      { path: 'jobs/:id', element: <JobDetailsPage /> },
      { path: 'planner', element: <PlannerPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:id', element: <ClientDetailsPage /> },
      { path: 'invoices', element: <InvoiceRegisterPage /> },
      { path: 'invoices/:id', element: <InvoicePage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      {
        path: 'calendar',
        element: (
          <ComingSoonPage
            title="Calendar"
            phase="Phase 3"
            description="A day-by-day calendar view for arranging meetings. The Planner already covers scheduling for now."
          />
        ),
      },
    ],
  },
]);
