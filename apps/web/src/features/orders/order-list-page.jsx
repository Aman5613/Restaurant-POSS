import React, { useState, useMemo } from 'react';
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
  Receipt,
  ChefHat,
  Clock,
  Eye,
  FileText,
} from 'lucide-react';
import { formatPaiseToRupees, ORDER_STATUS, ORDER_TYPES, TABLE_STATUS } from '@pos/shared';
import { usePosStore } from '@/stores/pos-store';

export function OrderListPage() {
  const navigate = useNavigate();
  const { orders: activeOrdersMap, invoices, tables } = usePosStore();
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [search, setSearch] = useState('');

  // Assemble real orders from active running orders + settled invoices
  const allOrders = useMemo(() => {
    const list = [];

    // 1. Running & Billed active table orders
    Object.entries(activeOrdersMap).forEach(([tableId, ord]) => {
      const table = tables.find((t) => t.id === tableId);
      const isBilled = table?.status === TABLE_STATUS.BILLED;
      const activeLines = (ord.lines || []).filter((l) => l.status !== 'CANCELLED');
      const itemsCount = activeLines.reduce((s, l) => s + l.quantity, 0);

      list.push({
        id: ord.orderNo || `ord_${tableId}`,
        orderNo: ord.orderNo || `ORD-${tableId}`,
        tableId,
        tableName: ord.tableName || table?.name || 'Counter',
        orderType: ord.orderType || ORDER_TYPES.DINE_IN,
        status: isBilled ? ORDER_STATUS.BILLED : ORDER_STATUS.RUNNING,
        guestCount: ord.guestCount || 2,
        itemsCount,
        totalAmount: ord.totalAmount || table?.runningAmount || 0,
        captainName: table?.captainName || 'Staff',
        customerName: ord.customerName,
        customerPhone: ord.customerPhone,
        createdAt: ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active',
      });
    });

    // 2. Settled invoices/bills
    Object.values(invoices).forEach((inv) => {
      const itemsCount = (inv.billLines || []).reduce((s, l) => s + l.quantity, 0);
      list.push({
        id: inv.invoiceNo,
        orderNo: inv.invoiceNo,
        tableId: inv.tableId,
        tableName: inv.tableName || 'Counter',
        orderType: ORDER_TYPES.DINE_IN,
        status: ORDER_STATUS.SETTLED,
        guestCount: inv.guestCount || 2,
        itemsCount,
        totalAmount: inv.grandTotal || 0,
        captainName: inv.billerName || 'Cashier',
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        paymentMode: inv.paymentMode,
        createdAt: inv.settledAt ? new Date(inv.settledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Settled',
      });
    });

    return list;
  }, [activeOrdersMap, invoices, tables]);

  const filteredOrders = allOrders.filter((o) => {
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
        return <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-semibold">RUNNING</Badge>;
      case ORDER_STATUS.BILLED:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold">BILLED</Badge>;
      case ORDER_STATUS.SETTLED:
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">SETTLED</Badge>;
      case ORDER_STATUS.CANCELLED:
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold">CANCELLED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case ORDER_TYPES.DINE_IN:
        return <UtensilsCrossed className="w-3.5 h-3.5 text-slate-500" />;
      case ORDER_TYPES.TAKEAWAY:
        return <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />;
      case ORDER_TYPES.DELIVERY:
        return <Truck className="w-3.5 h-3.5 text-slate-500" />;
      default:
        return null;
    }
  };

  const handleRowAction = (ord) => {
    if (ord.status === ORDER_STATUS.SETTLED) {
      navigate(`/invoices/preview?invoiceNo=${ord.orderNo}`);
    } else {
      navigate(`/orders?tableId=${ord.tableId}&tableName=${encodeURIComponent(ord.tableName)}`);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-700" />
            Orders & All Bills
          </h1>
          <p className="text-xs text-slate-500 font-medium">Live dining tables, active running orders, and settled customer bills</p>
        </div>

        <Button
          size="sm"
          className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 h-8 text-xs font-semibold"
          onClick={() => navigate('/orders/new')}
        >
          <Plus className="w-3.5 h-3.5" />
          New Order
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {['ALL', ORDER_STATUS.RUNNING, ORDER_STATUS.BILLED, ORDER_STATUS.SETTLED].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === st
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Bills' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search bill #, table, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 focus:bg-white text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Orders Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Active table orders and settled customer bills will be automatically displayed here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold">
                <tr>
                  <th className="py-2.5 px-4">Bill / Order #</th>
                  <th className="py-2.5 px-4">Type & Table</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Items</th>
                  <th className="py-2.5 px-4">Total Amount</th>
                  <th className="py-2.5 px-4">Captain / Cashier</th>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{ord.orderNo}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {getTypeIcon(ord.orderType)}
                        <span className="font-semibold text-slate-900">{ord.tableName}</span>
                        {ord.customerName && (
                          <span className="text-[11px] text-slate-500">({ord.customerName})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(ord.status)}</td>
                    <td className="py-3 px-4 text-slate-600">{ord.itemsCount} Items</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatPaiseToRupees(ord.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{ord.captainName}</td>
                    <td className="py-3 px-4 text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ord.createdAt}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleRowAction(ord)}
                      >
                        {ord.status === ORDER_STATUS.SETTLED ? (
                          <>
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            Receipt
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Manage
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
