import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  ShoppingBag,
  UtensilsCrossed,
  Truck,
  IndianRupee,
  Receipt,
  ChefHat,
  Clock,
  Eye,
} from 'lucide-react';
import { formatPaiseToRupees, ORDER_STATUS, ORDER_TYPES } from '@pos/shared';

export function OrderListPage() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [search, setSearch] = useState('');

  const [orders] = useState([
    {
      id: 'ord_1',
      orderNo: 'ORD-0041',
      orderType: ORDER_TYPES.DINE_IN,
      tableName: 'Table 1',
      status: ORDER_STATUS.RUNNING,
      guestCount: 3,
      itemsCount: 4,
      totalAmount: 94000,
      captainName: 'Ramesh',
      createdAt: '12 mins ago',
    },
    {
      id: 'ord_2',
      orderNo: 'ORD-0042',
      orderType: ORDER_TYPES.DINE_IN,
      tableName: 'Table 3',
      status: ORDER_STATUS.BILLED,
      guestCount: 5,
      itemsCount: 7,
      totalAmount: 185000,
      captainName: 'Suresh',
      createdAt: '45 mins ago',
    },
    {
      id: 'ord_3',
      orderNo: 'ORD-0043',
      orderType: ORDER_TYPES.TAKEAWAY,
      tableName: 'Counter',
      customerName: 'Rahul Verma',
      customerPhone: '9876543210',
      status: ORDER_STATUS.RUNNING,
      guestCount: 1,
      itemsCount: 3,
      totalAmount: 72000,
      captainName: 'Biller Counter 1',
      createdAt: '8 mins ago',
    },
    {
      id: 'ord_4',
      orderNo: 'ORD-0044',
      orderType: ORDER_TYPES.DELIVERY,
      tableName: 'Online Swiggy',
      customerName: 'Priya Sharma',
      status: ORDER_STATUS.RUNNING,
      guestCount: 1,
      itemsCount: 2,
      totalAmount: 48000,
      captainName: 'Delivery Dispatcher',
      createdAt: '5 mins ago',
    },
    {
      id: 'ord_5',
      orderNo: 'ORD-0039',
      orderType: ORDER_TYPES.DINE_IN,
      tableName: 'Table 5',
      status: ORDER_STATUS.SETTLED,
      guestCount: 2,
      itemsCount: 5,
      totalAmount: 112000,
      captainName: 'Ramesh',
      createdAt: '1 hour ago',
    },
  ]);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatus === 'ALL' || o.status === selectedStatus;
    const matchesType = selectedType === 'ALL' || o.orderType === selectedType;
    const matchesSearch =
      o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      (o.tableName && o.tableName.toLowerCase().includes(search.toLowerCase())) ||
      (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case ORDER_STATUS.RUNNING:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">RUNNING</Badge>;
      case ORDER_STATUS.BILLED:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">BILLED</Badge>;
      case ORDER_STATUS.SETTLED:
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">SETTLED</Badge>;
      case ORDER_STATUS.CANCELLED:
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/40">CANCELLED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case ORDER_TYPES.DINE_IN:
        return <UtensilsCrossed className="w-4 h-4 text-emerald-400" />;
      case ORDER_TYPES.TAKEAWAY:
        return <ShoppingBag className="w-4 h-4 text-blue-400" />;
      case ORDER_TYPES.DELIVERY:
        return <Truck className="w-4 h-4 text-purple-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-400" />
            Orders Management
          </h1>
          <p className="text-sm text-slate-400">View active dining, takeaway, and delivery orders</p>
        </div>

        <Button
          className="bg-emerald-600 hover:bg-emerald-500 gap-1.5"
          onClick={() => navigate('/orders/new')}
        >
          <Plus className="w-4 h-4" />
          New Order
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {['ALL', ORDER_STATUS.RUNNING, ORDER_STATUS.BILLED, ORDER_STATUS.SETTLED].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === st
                  ? 'bg-slate-200 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'ALL' ? 'All Status' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <Input
              placeholder="Search by order #, table, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-slate-950 border-slate-800 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Type & Table</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Captain</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{ord.orderNo}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {getTypeIcon(ord.orderType)}
                        <span className="font-semibold text-slate-200">{ord.tableName}</span>
                        {ord.customerName && (
                          <span className="text-xs text-slate-400">({ord.customerName})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(ord.status)}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{ord.itemsCount} Items</td>
                    <td className="py-3.5 px-4 font-bold text-white flex items-center pt-4">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {formatPaiseToRupees(ord.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{ord.captainName}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 flex items-center gap-1 pt-4">
                      <Clock className="w-3 h-3" />
                      {ord.createdAt}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                        onClick={() => navigate(`/orders?orderId=${ord.id}`)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
