import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Receipt,
  IndianRupee,
  ShoppingBag,
  Percent,
  Calendar,
  Download,
  Clock,
  CreditCard,
  PieChart as PieIcon,
  BarChart3,
  UtensilsCrossed,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatPaiseToRupees } from '@pos/shared';
import { usePosStore } from '@/stores/pos-store';

const MODE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

export function ReportsDashboardPage() {
  const [dateFilter, setDateFilter] = useState('today');
  const { invoices } = usePosStore();

  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();
    const endDate = new Date();

    if (dateFilter === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'yesterday') {
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFilter === 'week') {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  // 1. Fetch real sales summary from API
  const { data: apiSalesReport } = useQuery({
    queryKey: ['reports-sales', dateFilter],
    queryFn: async () => {
      try {
        const range = getDateRange();
        const res = await apiClient.get('/v1/reports/sales', { params: range });
        return res.data?.data;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  // 2. Fetch real item-wise report from API
  const { data: apiItemReport = [] } = useQuery({
    queryKey: ['reports-items', dateFilter],
    queryFn: async () => {
      try {
        const range = getDateRange();
        const res = await apiClient.get('/v1/reports/item-wise', { params: range });
        return res.data?.data || [];
      } catch {
        return [];
      }
    },
    retry: false,
  });

  // Combine API metrics with live POS settled invoices
  const stats = useMemo(() => {
    const apiRev = apiSalesReport?.totalRevenue || 0;
    const apiSub = apiSalesReport?.totalSubtotal || 0;
    const apiDisc = apiSalesReport?.totalDiscount || 0;
    const apiTax = apiSalesReport?.totalTax || 0;
    const apiCount = apiSalesReport?.billCount || 0;

    const localList = Object.values(invoices || {});
    const localRev = localList.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const localSub = localList.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
    const localDisc = localList.reduce((sum, inv) => sum + (inv.discount || 0), 0);
    const localTax = localList.reduce((sum, inv) => sum + ((inv.cgst || 0) + (inv.sgst || 0)), 0);
    const localCount = localList.length;

    const totalRevenue = apiRev + localRev;
    const totalSubtotal = apiSub + localSub;
    const totalDiscount = apiDisc + localDisc;
    const totalTax = apiTax + localTax;
    const billCount = apiCount + localCount;
    const avgBillValue = billCount > 0 ? Math.round(totalRevenue / billCount) : 0;

    // Merge payment modes
    const paymentMap = new Map();
    (apiSalesReport?.paymentModes || []).forEach((p) => {
      paymentMap.set(p.mode, (paymentMap.get(p.mode) || 0) + (p.total || 0));
    });
    localList.forEach((inv) => {
      const mode = inv.paymentMode || 'CASH';
      paymentMap.set(mode, (paymentMap.get(mode) || 0) + (inv.grandTotal || 0));
    });

    const paymentModes = Array.from(paymentMap.entries()).map(([mode, total]) => ({
      mode,
      total,
    }));

    return {
      totalRevenue,
      totalSubtotal,
      totalDiscount,
      totalTax,
      billCount,
      avgBillValue,
      paymentModes,
      hourlyData: apiSalesReport?.hourlyData || [],
    };
  }, [apiSalesReport, invoices]);

  // Combine item-wise sales
  const combinedItemReport = useMemo(() => {
    const itemMap = new Map();

    (apiItemReport || []).forEach((i) => {
      itemMap.set(i.name, {
        name: i.name,
        quantity: i.quantity || 0,
        revenue: i.revenue || 0,
      });
    });

    Object.values(invoices || {}).forEach((inv) => {
      (inv.billLines || []).forEach((l) => {
        const existing = itemMap.get(l.name) || { name: l.name, quantity: 0, revenue: 0 };
        itemMap.set(l.name, {
          name: l.name,
          quantity: existing.quantity + (l.quantity || 1),
          revenue: existing.revenue + (l.unitPrice || 0) * (l.quantity || 1),
        });
      });
    });

    return Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [apiItemReport, invoices]);

  const chartData = (stats.hourlyData || []).map((h) => ({
    hour: h.hour,
    Sales: (h.sales || 0) / 100,
    Orders: h.orders || 0,
  }));

  const pieData = (stats.paymentModes || []).map((p) => ({
    name: p.mode,
    value: (p.total || 0) / 100,
  }));

  const handleExportCSV = () => {
    if (!combinedItemReport.length) return;
    const headers = ['Item Name', 'Quantity Sold', 'Gross Revenue (INR)'];
    const rows = combinedItemReport.map((i) => [`"${i.name}"`, i.quantity, (i.revenue || 0) / 100]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `item_sales_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-700" />
            Analytics & Sales Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Real-time business performance, revenue streams, hourly trends, and item-wise sales
          </p>
        </div>

        {/* Filters & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: 'Month' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  dateFilter === f.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 h-8 text-xs font-semibold"
            disabled={!combinedItemReport.length}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Revenue</span>
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-slate-900">{formatPaiseToRupees(stats.totalRevenue)}</p>
          <span className="text-[10px] text-slate-400">Incl. taxes & charges</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Net Taxable</span>
            <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <p className="text-lg font-bold text-slate-900">{formatPaiseToRupees(stats.totalSubtotal)}</p>
          <span className="text-[10px] text-slate-400">Food & Beverage</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Invoices Settled</span>
            <Receipt className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <p className="text-lg font-bold text-slate-900">{stats.billCount}</p>
          <span className="text-[10px] text-slate-400">Paid orders count</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Avg Bill Size</span>
            <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-lg font-bold text-slate-900">{formatPaiseToRupees(stats.avgBillValue)}</p>
          <span className="text-[10px] text-slate-400">Per order avg</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Discounts</span>
            <Percent className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-lg font-bold text-slate-900">{formatPaiseToRupees(stats.totalDiscount)}</p>
          <span className="text-[10px] text-slate-400">Approved promos</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total GST</span>
            <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <p className="text-lg font-bold text-slate-900">{formatPaiseToRupees(stats.totalTax)}</p>
          <span className="text-[10px] text-slate-400">CGST + SGST (5%)</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hourly Sales Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-600" />
            Hourly Sales Distribution (₹)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val) => [`₹${val}`, 'Sales']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="Sales" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Modes Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-rose-600" />
            Payment Modes Breakdown
          </h2>

          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              No payments settled in this period
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={MODE_COLORS[index % MODE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`₹${val}`, 'Revenue']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="border-t border-slate-100 pt-2 space-y-1">
            {stats.paymentModes.map((p) => (
              <div key={p.mode} className="flex justify-between text-xs">
                <span className="text-slate-600 font-semibold">{p.mode}</span>
                <span className="font-bold text-slate-900">{formatPaiseToRupees(p.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Item-Wise Sales Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-rose-600" />
            Item-Wise Sales & Velocity
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {combinedItemReport.length} Items Sold
          </span>
        </div>

        {combinedItemReport.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No item sales recorded for the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold">
                <tr>
                  <th className="py-2.5 px-4">Menu Item</th>
                  <th className="py-2.5 px-4 text-center">Quantity Sold</th>
                  <th className="py-2.5 px-4 text-right">Gross Sales (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {combinedItemReport.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatPaiseToRupees(item.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
