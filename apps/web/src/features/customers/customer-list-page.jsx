import React, { useState, useMemo } from 'react';
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
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatPaiseToRupees } from '@pos/shared';
import { usePosStore } from '@/stores/pos-store';

export function CustomerListPage() {
  const queryClient = useQueryClient();
  const { customers: localCustomers, saveCustomer, collectCustomerDue } = usePosStore();
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
  const [notification, setNotification] = useState(null);

  // Attempt to fetch from API if connected
  const { data: apiCustomers = [] } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/v1/customers', {
          params: search ? { q: search } : {},
        });
        return res.data?.data || [];
      } catch {
        return [];
      }
    },
    retry: false,
  });

  // Combine and deduplicate real customers by phone
  const combinedCustomers = useMemo(() => {
    const map = new Map();

    // 1. Add local customers (including customers auto-created on bill settlement)
    (localCustomers || []).forEach((c) => {
      if (c.phone) map.set(c.phone, c);
    });

    // 2. Add API customers if present
    apiCustomers.forEach((c) => {
      if (c.phone) {
        const existing = map.get(c.phone) || {};
        map.set(c.phone, {
          ...existing,
          ...c,
          id: c._id || c.id || existing.id,
          totalSpentPaise: (c.stats?.total_spend !== undefined ? c.stats.total_spend : c.totalSpentPaise) ?? existing.totalSpentPaise ?? 0,
          outstandingDuePaise: (c.stats?.current_due !== undefined ? c.stats.current_due : c.outstandingDuePaise) ?? existing.outstandingDuePaise ?? 0,
          visitsCount: (c.stats?.total_orders !== undefined ? c.stats.total_orders : c.visitsCount) ?? existing.visitsCount ?? 1,
        });
      }
    });

    const list = Array.from(map.values());
    if (!search) return list;

    const q = search.toLowerCase();
    return list.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [localCustomers, apiCustomers, search]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const newCust = {
      id: `cust_${Date.now()}`,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      gstin: formData.gstin.trim(),
      address: formData.address.trim(),
      totalSpentPaise: 0,
      visitsCount: 1,
      outstandingDuePaise: 0,
    };

    saveCustomer(newCust);

    try {
      await apiClient.post('/v1/customers', newCust);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch {
      // Local store has it saved
    }

    setIsAddOpen(false);
    setFormData({ name: '', phone: '', email: '', gstin: '', address: '' });
    setNotification(`Customer ${newCust.name} added successfully!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCollectDue = async () => {
    if (!dueTarget || !dueAmount || Number(dueAmount) <= 0) return;
    const amtPaise = Math.round(Number(dueAmount) * 100);

    collectCustomerDue(dueTarget.id || dueTarget._id, amtPaise);

    try {
      await apiClient.post(`/v1/customers/${dueTarget._id || dueTarget.id}/dues/collect`, {
        amount: amtPaise,
        paymentMode: dueMode,
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch {
      // Local fallback
    }

    setNotification(`Collected due payment of ₹${dueAmount} from ${dueTarget.name}!`);
    setDueTarget(null);
    setDueAmount('');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExportCSV = () => {
    if (!combinedCustomers.length) return;
    const headers = ['Name', 'Phone', 'Email', 'GSTIN', 'Total Spend (INR)', 'Outstanding Due (INR)'];
    const rows = combinedCustomers.map((c) => [
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
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            Customer Directory & Credit Ledger
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Customer phone contacts, visit history, total billing spend, and outstanding credit dues
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 h-8 text-xs font-semibold"
            onClick={handleExportCSV}
            disabled={!combinedCustomers.length}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>

          <Button
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 h-8 text-xs font-semibold"
            onClick={() => setIsAddOpen(true)}
          >
            <UserPlus className="w-3.5 h-3.5" />
            New Customer
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 focus:bg-white text-slate-800"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium pr-2">
          {combinedCustomers.length} Customers Registered
        </span>
      </div>

      {/* Customers Table */}
      {combinedCustomers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Customers Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Customers will appear here automatically when saving phone numbers on the billing screen or adding them above.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold">
                <tr>
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4">Contact Details</th>
                  <th className="py-2.5 px-4">GSTIN</th>
                  <th className="py-2.5 px-4 text-right">Total Billing Spend</th>
                  <th className="py-2.5 px-4 text-right">Credit Due</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {combinedCustomers.map((c) => {
                  const hasDue = (c.outstandingDuePaise || 0) > 0;
                  return (
                    <tr key={c.id || c._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        {c.address && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{c.address}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-900 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.phone}
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {c.email}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {c.gstin || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatPaiseToRupees(c.totalSpentPaise || 0)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {hasDue ? (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold text-xs">
                            {formatPaiseToRupees(c.outstandingDuePaise)}
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                            Nil
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasDue ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
                            onClick={() => {
                              setDueTarget(c);
                              setDueAmount(((c.outstandingDuePaise || 0) / 100).toString());
                            }}
                          >
                            <Wallet className="w-3 h-3 mr-1" />
                            Collect Due
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                <UserPlus className="w-4 h-4 text-rose-600" />
                Add New Customer
              </CardTitle>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <form onSubmit={handleCreateCustomer}>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Customer Name *</label>
                  <Input
                    placeholder="e.g. Ramesh Chandra"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 bg-slate-50 border-slate-200 text-xs h-9 text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Phone Number *</label>
                  <Input
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 bg-slate-50 border-slate-200 text-xs h-9 text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <Input
                    placeholder="e.g. customer@example.com"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 bg-slate-50 border-slate-200 text-xs h-9 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">GSTIN (Optional B2B)</label>
                  <Input
                    placeholder="e.g. 27AAPFU0939F1ZV"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="mt-1 bg-slate-50 border-slate-200 text-xs h-9 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Delivery Address / Notes</label>
                  <Input
                    placeholder="e.g. Flat 402, Bandra West"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 bg-slate-50 border-slate-200 text-xs h-9 text-slate-900"
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-4 border-t border-slate-100">
                <Button variant="ghost" size="sm" type="button" className="text-xs text-slate-600" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold">
                  Save Customer
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Collect Due Modal */}
      {dueTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-white border-slate-200 shadow-2xl">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                Collect Credit Due
              </CardTitle>
              <button onClick={() => setDueTarget(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">{dueTarget.name}</div>
                <div className="text-slate-500 font-mono">{dueTarget.phone}</div>
                <div className="mt-1 text-rose-700 font-semibold">
                  Outstanding: {formatPaiseToRupees(dueTarget.outstandingDuePaise)}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Amount to Collect (₹)</label>
                <Input
                  type="number"
                  value={dueAmount}
                  onChange={(e) => setDueAmount(e.target.value)}
                  className="bg-slate-50 border-slate-200 mt-1 h-9 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Payment Mode</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {['cash', 'upi', 'card'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDueMode(m)}
                      className={`py-1.5 rounded-lg text-xs font-semibold uppercase border transition-all ${
                        dueMode === m
                          ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-100">
              <Button variant="ghost" size="sm" className="text-xs text-slate-600" onClick={() => setDueTarget(null)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold" onClick={handleCollectDue}>
                Collect & Settle
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
