import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/app-layout';
import { RoleGuard } from './components/layout/role-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { LoginPage } from './features/auth/login-page';
import { PinLoginPage } from './features/auth/pin-login-page';
import { SetupWizardPage } from './features/outlet/setup-wizard-page';
import { OutletSettingsPage } from './features/outlet/outlet-settings-page';
import { UsersPage } from './features/users/users-page';
import { MenuPage } from './features/menu/menu-page';
import { FloorViewPage } from './features/tables/floor-view-page';
import { OrderScreenPage } from './features/orders/order-screen-page';
import { OrderListPage } from './features/orders/order-list-page';
import { PrintQueuePage } from './features/kot/print-queue-page';
import { BillingPage } from './features/billing/billing-page';
import { InvoicePreviewPage } from './features/billing/invoice-preview-page';
import { DayManagementPage } from './features/day-ops/day-management-page';
import { CustomerListPage } from './features/customers/customer-list-page';
import { ReportsDashboardPage } from './features/reports/reports-dashboard-page';
import { AuditLogPage } from './features/audit/audit-log-page';
import { ROLES } from '@pos/shared';

const queryClient = new QueryClient();

// Overview Dashboard
function Dashboard() {
  return <FloorViewPage />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pin-login" element={<PinLoginPage />} />
          <Route path="/setup" element={<SetupWizardPage />} />

          {/* Main App Layout */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="tables" element={<FloorViewPage />} />
            <Route path="orders" element={<OrderScreenPage />} />
            <Route path="orders/new" element={<OrderScreenPage />} />
            <Route path="orders/list" element={<OrderListPage />} />
            <Route path="kot" element={<PrintQueuePage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="invoices/preview" element={<InvoicePreviewPage />} />
            <Route path="day-ops" element={<DayManagementPage />} />
            <Route path="customers" element={<CustomerListPage />} />
            <Route path="menu" element={<MenuPage />} />

            {/* Protected Routes by Role */}
            <Route element={<RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]} />}>
              <Route path="reports" element={<ReportsDashboardPage />} />
              <Route path="audit-logs" element={<AuditLogPage />} />
              <Route path="settings" element={<OutletSettingsPage />} />
              <Route path="users" element={<UsersPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
