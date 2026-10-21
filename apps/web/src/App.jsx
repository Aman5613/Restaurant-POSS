import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';

const queryClient = new QueryClient();

// Dashboard preview placeholder for Phase 0
function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Restaurant Overview</h1>
          <p className="text-sm text-muted-foreground">
            Foundation and infrastructure established successfully.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Refresh Data</Button>
          <Button>New Quick Order</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Tables</CardDescription>
            <CardTitle className="text-3xl font-bold text-blue-600">8 / 24</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="occupied">Running Orders</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today's Sales</CardDescription>
            <CardTitle className="text-3xl font-bold text-emerald-600">₹42,850</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">Across 68 orders</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending KOTs</CardDescription>
            <CardTitle className="text-3xl font-bold text-amber-600">3</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="billed">Kitchen Queue</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sync Engine</CardDescription>
            <CardTitle className="text-3xl font-bold text-emerald-500">Online</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">0 pending sync events</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="tables" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
