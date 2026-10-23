import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Clock,
  ArrowRightLeft,
  Search,
  Plus,
  UtensilsCrossed,
  RotateCcw,
} from 'lucide-react';
import { formatPaiseToRupees, TABLE_STATUS } from '@pos/shared';
import { usePosStore } from '@/stores/pos-store';
import { apiClient } from '@/lib/api-client';
import { useSocket } from '@/hooks/use-socket';

export function FloorViewPage() {
  const navigate = useNavigate();
  const { tables, areas: storeAreas, transferTable } = usePosStore();
  const { broadcastTableTransfer } = useSocket();
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [transferModal, setTransferModal] = useState(null);

  const areas = storeAreas?.length ? storeAreas : [
    { id: 'area_1', name: 'Ground Floor AC' },
    { id: 'area_2', name: 'Terrace Garden' },
    { id: 'area_3', name: 'First Floor Family' },
  ];

  const filteredTables = (tables || []).filter((t) => {
    const matchesArea = selectedArea === 'ALL' || t.areaId === selectedArea;
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tableNumber.toLowerCase().includes(search.toLowerCase());
    return matchesArea && matchesStatus && matchesSearch;
  });

  const vacantCount = (tables || []).filter((t) => t.status === TABLE_STATUS.VACANT).length;
  const occupiedCount = (tables || []).filter((t) => t.status === TABLE_STATUS.OCCUPIED).length;
  const billedCount = (tables || []).filter((t) => t.status === TABLE_STATUS.BILLED).length;
  const totalRunningSales = (tables || []).reduce((acc, t) => acc + (t.runningAmount || 0), 0);

  const getStatusCardClasses = (status) => {
    switch (status) {
      case TABLE_STATUS.VACANT:
        return 'bg-white border-slate-200 hover:border-slate-300 shadow-xs';
      case TABLE_STATUS.OCCUPIED:
        return 'bg-sky-50/30 border-sky-300 hover:border-sky-400 shadow-xs';
      case TABLE_STATUS.BILLED:
        return 'bg-emerald-50/30 border-emerald-300 hover:border-emerald-400 shadow-xs';
      case TABLE_STATUS.RESERVED:
        return 'bg-amber-50/30 border-amber-300 hover:border-amber-400 shadow-xs';
      default:
        return 'bg-white border-slate-200';
    }
  };

  const handleTransfer = async (targetTable) => {
    if (!transferModal || !targetTable) return;
    const sourceTableId = transferModal.id;
    const targetTableId = targetTable.id;

    // 1. Move table state & orders in POS store
    transferTable(sourceTableId, targetTableId);

    // 2. Broadcast transfer to all connected devices in real time
    broadcastTableTransfer(sourceTableId, targetTableId);

    // 3. Sync transfer to backend API if online
    try {
      await apiClient.post('/v1/tables/transfer', {
        sourceTableId,
        targetTableId,
        reason: 'Customer requested table shift',
      }).catch(() => null);
    } catch (_err) {
      // offline fallback
    }

    setTransferModal(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case TABLE_STATUS.VACANT:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Blank
          </span>
        );
      case TABLE_STATUS.OCCUPIED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100/70 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Running
          </span>
        );
      case TABLE_STATUS.BILLED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/70 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Printed
          </span>
        );
      case TABLE_STATUS.RESERVED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/70 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Reserved
          </span>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleTableClick = (table) => {
    if (table.status === TABLE_STATUS.BILLED) {
      navigate(`/billing?tableId=${table.id}&tableName=${encodeURIComponent(table.name)}`);
    } else {
      navigate(`/orders?tableId=${table.id}&tableName=${encodeURIComponent(table.name)}`);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Table View</h1>
              <span className="text-xs text-slate-500 font-medium">
                {tables.length} Total Tables
              </span>
            </div>
            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400" />
                Blank Table ({vacantCount})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                Running ({occupiedCount})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Printed Bill ({billedCount})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Reserved
              </span>
            </div>
          </div>

          {/* Quick Actions & Live Metric */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right hidden sm:block">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Floor Total</p>
              <p className="text-sm font-bold text-slate-900">{formatPaiseToRupees(totalRunningSales)}</p>
            </div>

            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5 h-9 text-xs"
              onClick={() => navigate('/orders/new')}
            >
              <Plus className="w-4 h-4" />
              New Order
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 font-medium h-9 text-xs"
              onClick={() => navigate('/orders?type=takeaway')}
            >
              Take Away
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 font-medium h-9 text-xs"
              onClick={() => navigate('/orders?type=delivery')}
            >
              Delivery
            </Button>
          </div>
        </div>
      </div>

      {/* Area Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedArea('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedArea === 'ALL'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Areas ({tables.length})
          </button>
          {areas.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedArea(a.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedArea === a.id
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search table number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 focus:bg-white text-slate-800"
            />
          </div>

          <div className="hidden lg:flex items-center gap-1 border-l border-slate-200 pl-2">
            {['ALL', TABLE_STATUS.VACANT, TABLE_STATUS.OCCUPIED, TABLE_STATUS.BILLED].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  selectedStatus === st
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3.5">
        {filteredTables.map((table) => {
          const isOccupied = table.status === TABLE_STATUS.OCCUPIED;
          const isBilled = table.status === TABLE_STATUS.BILLED;
          const isVacant = table.status === TABLE_STATUS.VACANT;

          return (
            <div
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all cursor-pointer hover:shadow-md ${getStatusCardClasses(
                table.status
              )}`}
            >
              {/* Table Card Header */}
              <div>
                <div className="flex items-start justify-between gap-1 pb-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight">
                      {table.name}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 pt-0.5">
                      <Users className="w-3 h-3 text-slate-400" />
                      {table.capacity} Seater {table.guestCount ? `• ${table.guestCount} Guests` : ''}
                    </p>
                  </div>
                  {getStatusBadge(table.status)}
                </div>

                {/* Status Details */}
                {(isOccupied || isBilled) && (
                  <div className="bg-white/90 border border-slate-200/80 rounded-lg p-2.5 space-y-1 my-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {table.elapsedMinutes || 5} mins
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {formatPaiseToRupees(table.runningAmount)}
                      </span>
                    </div>
                    {table.captainName && (
                      <p className="text-[10px] text-slate-500 truncate">
                        {table.captainName}
                      </p>
                    )}
                  </div>
                )}

                {isVacant && (
                  <div className="py-4 text-center my-1">
                    <p className="text-xs text-slate-400 font-medium">Ready for guests</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div
                className="pt-2 border-t border-slate-100 flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {isVacant ? (
                  <Button
                    size="sm"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-7 gap-1 font-semibold"
                    onClick={() => handleTableClick(table)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Open Order
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs h-7 font-semibold border-slate-300 text-slate-800 hover:bg-slate-100"
                      onClick={() => handleTableClick(table)}
                    >
                      {isBilled ? 'View Bill' : 'Manage'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
                      title="Transfer Table"
                      onClick={() => setTransferModal(table)}
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Transfer Modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Transfer from {transferModal.name}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Select a vacant destination table:
              </p>

              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto no-scrollbar">
                {tables.filter((t) => t.status === TABLE_STATUS.VACANT).length === 0 ? (
                  <p className="col-span-2 text-center text-xs text-slate-500 py-6">
                    No vacant tables available to transfer to.
                  </p>
                ) : (
                  tables
                    .filter((t) => t.status === TABLE_STATUS.VACANT)
                    .map((vacantTable) => (
                      <Button
                        key={vacantTable.id}
                        variant="outline"
                        className="justify-start gap-2 h-11 border-slate-200 hover:border-rose-400 hover:bg-rose-50/50"
                        onClick={() => handleTransfer(vacantTable)}
                      >
                        <UtensilsCrossed className="w-4 h-4 text-slate-500" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800">{vacantTable.name}</p>
                          <p className="text-[10px] text-slate-500">{vacantTable.capacity} Seater</p>
                        </div>
                      </Button>
                    ))
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-600"
                  onClick={() => setTransferModal(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
