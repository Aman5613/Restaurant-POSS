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
import { KitchenDisplayPage } from './features/kot/kitchen-display-page';
import { BillingPage } from './features/billing/billing-page';
import { InvoicePreviewPage } from './features/billing/invoice-preview-page';
import { DayManagementPage } from './features/day-ops/day-management-page';
import { ManagerPage } from './features/manager/manager-page';
import { CustomerListPage } from './features/customers/customer-list-page';
import { ReportsDashboardPage } from './features/reports/reports-dashboard-page';
import { AuditLogPage } from './features/audit/audit-log-page';
import { SuperAdminPage } from './features/super-admin/super-admin-page';
import { AdminDashboardPage } from './features/admin/admin-dashboard-page';
import { ROLES } from '@pos/shared';
import { useAuthStore, getRoleHome } from './stores/auth-store';

const queryClient = new QueryClient();

// Overview Dashboard - routes to dedicated role dashboard
function Dashboard() {
  const { user } = useAuthStore();
  return <Navigate to={getRoleHome(user?.role, user?.isSetupCompleted)} replace />;
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

            {/* Service & Dining Routes (Captain, Biller, Manager, Admin) */}
            <Route element={<RoleGuard allowedRoles={[ROLES.CAPTAIN, ROLES.BILLER, ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
              <Route path="tables" element={<FloorViewPage />} />
              <Route path="orders" element={<OrderScreenPage />} />
              <Route path="orders/new" element={<OrderScreenPage />} />
              <Route path="orders/list" element={<OrderListPage />} />
            </Route>

            {/* Kitchen & Menu Routes (Cook, Staff, Manager, Admin) */}
            <Route path="kot" element={<PrintQueuePage />} />
            <Route path="kitchen" element={<KitchenDisplayPage />} />
            <Route path="kds" element={<KitchenDisplayPage />} />
            <Route path="menu" element={<MenuPage />} />

            {/* Cashier & Billing Routes (Captain, Biller, Manager, Admin) */}
            <Route element={<RoleGuard allowedRoles={[ROLES.CAPTAIN, ROLES.BILLER, ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
              <Route path="billing" element={<BillingPage />} />
              <Route path="invoices/preview" element={<InvoicePreviewPage />} />
              <Route path="day-ops" element={<DayManagementPage />} />
              <Route path="customers" element={<CustomerListPage />} />
            </Route>

            {/* Manager Operations & Reporting */}
            <Route element={<RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN]} />}>
              <Route path="manager" element={<ManagerPage />} />
              <Route path="reports" element={<ReportsDashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="audit-logs" element={<AuditLogPage />} />
            </Route>

            {/* Admin (Owner) Control Hub */}
            <Route element={<RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
              <Route path="settings" element={<OutletSettingsPage />} />
              <Route path="admin" element={<AdminDashboardPage />} />
            </Route>

            {/* Platform Super-Admin Control Hub */}
            <Route element={<RoleGuard allowedRoles={[ROLES.SUPER_ADMIN]} />}>
              <Route path="super-admin" element={<SuperAdminPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
