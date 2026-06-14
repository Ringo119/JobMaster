import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { JobRegisterPage } from './pages/JobRegisterPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { PlannerPage } from './pages/PlannerPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailsPage } from './pages/ClientDetailsPage';
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
      { path: 'settings', element: <SettingsPage /> },
      {
        path: 'calendar',
        element: (
          <ComingSoonPage
            title="Calendar"
            description="A day-by-day calendar view for arranging meetings. The Planner already covers scheduling for now."
          />
        ),
      },
      {
        path: 'invoices',
        element: (
          <ComingSoonPage
            title="Invoices"
            description="Invoice generator and register with automatic VAT and PDF/email output."
          />
        ),
      },
      {
        path: 'reports',
        element: (
          <ComingSoonPage
            title="Reports"
            description="Monthly turnover, outstanding money, fees by client and VAT owed."
          />
        ),
      },
    ],
  },
]);
