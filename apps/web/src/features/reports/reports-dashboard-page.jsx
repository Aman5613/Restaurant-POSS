import React, { useState } from 'react';
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
import { formatCurrency } from '@pos/shared';

const MODE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

export function ReportsDashboardPage() {
  const [dateFilter, setDateFilter] = useState('today');

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();
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

  const { data: salesReport, isLoading: isSalesLoading } = useQuery({
    queryKey: ['reports-sales', dateFilter],
    queryFn: async () => {
      const range = getDateRange();
      const res = await apiClient.get('/v1/reports/sales', { params: range });
      return res.data?.data;
    },
  });

  const { data: itemReport = [] } = useQuery({
    queryKey: ['reports-items', dateFilter],
    queryFn: async () => {
      const range = getDateRange();
      const res = await apiClient.get('/v1/reports/item-wise', { params: range });
      return res.data?.data || [];
    },
  });

  const stats = salesReport || {
    totalRevenue: 0,
    totalSubtotal: 0,
    totalDiscount: 0,
    totalTax: 0,
    billCount: 0,
    avgBillValue: 0,
    paymentModes: [],
    hourlyData: [],
  };

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
    if (!itemReport.length) return;
    const headers = ['Item Name', 'Quantity Sold', 'Gross Revenue (INR)'];
    const rows = itemReport.map((i) => [`"${i.name}"`, i.quantity, (i.revenue || 0) / 100]);
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics & Sales Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time business performance, revenue streams, hourly trends, and item-wise sales.
          </p>
        </div>

        {/* Filters & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-md shadow-sm border bg-muted/40 p-1">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: 'Month' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id)}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  dateFilter === f.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Total Revenue</span>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold mt-2 text-foreground">
            {formatCurrency(stats.totalRevenue || 0)}
          </div>
          <span className="text-[11px] text-muted-foreground">Incl. taxes & charges</span>
        </Card>

        <Card className="p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Net Taxable</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-bold mt-2 text-foreground">
            {formatCurrency(stats.totalSubtotal || 0)}
          </div>
          <span className="text-[11px] text-muted-foreground">Food & Beverage</span>
        </Card>

        <Card className="p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Invoices Settled</span>
            <Receipt className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold mt-2 text-foreground">{stats.billCount || 0}</div>
          <span className="text-[11px] text-muted-foreground">Paid orders</span>
        </Card>

        <Card className="p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Avg Bill Size</span>
            <ShoppingBag className="h-4 w-4 text-violet-500" />
          </div>
          <div className="text-xl font-bold mt-2 text-foreground">
            {formatCurrency(stats.avgBillValue || 0)}
          </div>
          <span className="text-[11px] text-muted-foreground">Per order avg</span>
        </Card>

        <Card className="p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Discounts</span>
            <Percent className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold mt-2 text-foreground">
            {formatCurrency(stats.totalDiscount || 0)}
          </div>
          <span className="text-[11px] text-muted-foreground">Approved concessions</span>
        </Card>

        <Card className="p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Total GST</span>
            <CreditCard className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold mt-2 text-foreground">
            {formatCurrency(stats.totalTax || 0)}
          </div>
          <span className="text-[11px] text-muted-foreground">CGST + SGST</span>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Sales Bar Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Hourly Sales Trend (₹)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [`₹${val}`, 'Sales']}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Modes Breakdown */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" />
              Settlement Modes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                No payment data for this period
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={MODE_COLORS[index % MODE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [`₹${val}`, 'Revenue']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Items Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            Top Performing Items
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {itemReport.length} items recorded
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-medium">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4 text-center">Quantity Sold</th>
                  <th className="py-3 px-4 text-right">Taxable Turnover</th>
                  <th className="py-3 px-4 text-right">Gross Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {itemReport.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                      No item sales recorded for the selected period.
                    </td>
                  </tr>
                ) : (
                  itemReport.slice(0, 15).map((item, idx) => (
                    <tr key={item.itemId || idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-xs text-muted-foreground w-12">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <Badge variant="secondary" className="text-xs px-2.5">
                          {item.quantity}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground font-mono text-xs">
                        {formatCurrency(item.taxable || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-foreground">
                        {formatCurrency(item.revenue || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
