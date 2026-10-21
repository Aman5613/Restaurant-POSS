import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  IndianRupee,
  Wallet,
  Clock,
  Download,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@pos/shared';

export function CustomerListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [dueTarget, setDueTarget] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
  });
  const [dueAmount, setDueAmount] = useState('');
  const [dueMode, setDueMode] = useState('cash');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const res = await apiClient.get('/v1/customers', {
        params: search ? { q: search } : {},
      });
      return res.data?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (newCust) => apiClient.post('/v1/customers', newCust),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddOpen(false);
      setFormData({ name: '', phone: '', email: '', gstin: '', address: '' });
    },
  });

  const collectDueMutation = useMutation({
    mutationFn: ({ customerId, amount, paymentMode }) =>
      apiClient.post(`/v1/customers/${customerId}/due-payments`, {
        amount: Math.round(parseFloat(amount) * 100),
        paymentMode,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDueTarget(null);
      setDueAmount('');
    },
  });

  const handleExportCSV = () => {
    if (!customers.length) return;
    const headers = ['Name', 'Phone', 'Email', 'GSTIN', 'Total Spend (INR)', 'Outstanding Due (INR)'];
    const rows = customers.map((c) => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email || ''}"`,
      `"${c.gstin || ''}"`,
      (c.totalSpentPaise || 0) / 100,
      (c.outstandingDuePaise || 0) / 100,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Customer Directory & Credit Ledger
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer contacts, track visit history, loyalty, and settle outstanding credit dues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Customer
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Customers Table / Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-medium">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4 text-right">Total Spend</th>
                  <th className="py-3 px-4 text-right">Outstanding Due</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading customer records...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No customer records found. Click &apos;New Customer&apos; to create one.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => {
                    const hasDue = (c.outstandingDuePaise || 0) > 0;
                    return (
                      <tr key={c._id || c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{c.name}</div>
                          {c.address && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs">{c.address}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {c.phone}
                          </div>
                          {c.email && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              <Mail className="h-3 w-3" />
                              {c.email}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {c.gstin || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-foreground">
                          {formatCurrency(c.totalSpentPaise || 0)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {hasDue ? (
                            <Badge variant="destructive" className="font-semibold text-xs">
                              {formatCurrency(c.outstandingDuePaise)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                              Nil
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasDue && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-xs h-7 px-2.5"
                              onClick={() => {
                                setDueTarget(c);
                                setDueAmount(((c.outstandingDuePaise || 0) / 100).toString());
                              }}
                            >
                              <Wallet className="h-3 w-3 mr-1" />
                              Collect Due
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Add New Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Full Name *</label>
                <Input
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Phone Number *</label>
                <Input
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Email</label>
                <Input
                  placeholder="e.g. rahul@example.com"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">GSTIN (Optional)</label>
                <Input
                  placeholder="22AAAAA0000A1Z5"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  className="mt-1 uppercase"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Address / Delivery Notes</label>
                <Input
                  placeholder="Apartment, Street, Landmark"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="ghost" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!formData.name || !formData.phone || createMutation.isPending}
                  onClick={() => createMutation.mutate(formData)}
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Customer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Collect Due Modal */}
      {dueTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-primary" />
                Collect Outstanding Due
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="bg-muted p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-semibold">{dueTarget.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{dueTarget.phone}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-muted-foreground">Total Due:</span>
                  <span className="font-bold text-destructive">
                    {formatCurrency(dueTarget.outstandingDuePaise)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Amount to Collect (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  max={(dueTarget.outstandingDuePaise || 0) / 100}
                  value={dueAmount}
                  onChange={(e) => setDueAmount(e.target.value)}
                  className="mt-1 text-lg font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Payment Method</label>
                <select
                  value={dueMode}
                  onChange={(e) => setDueMode(e.target.value)}
                  className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / QR</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="ghost" onClick={() => setDueTarget(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={!dueAmount || parseFloat(dueAmount) <= 0 || collectDueMutation.isPending}
                  onClick={() =>
                    collectDueMutation.mutate({
                      customerId: dueTarget._id || dueTarget.id,
                      amount: dueAmount,
                      paymentMode: dueMode,
                    })
                  }
                >
                  {collectDueMutation.isPending ? 'Processing...' : 'Confirm Receipt'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
