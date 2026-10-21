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
  Merge,
  Search,
  PlusCircle,
  IndianRupee,
  UtensilsCrossed,
} from 'lucide-react';
import { formatPaiseToRupees, TABLE_STATUS } from '@pos/shared';

export function FloorViewPage() {
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [transferModal, setTransferModal] = useState(null);

  const areas = [
    { id: 'area_1', name: 'Ground Floor AC' },
    { id: 'area_2', name: 'Terrace Garden' },
    { id: 'area_3', name: 'First Floor Family' },
  ];

  const [tables, setTables] = useState([
    {
      id: 'tbl_1',
      tableNumber: 'T-01',
      name: 'Table 1',
      areaId: 'area_1',
      capacity: 4,
      status: TABLE_STATUS.OCCUPIED,
      runningAmount: 94000,
      elapsedMinutes: 38,
      captainName: 'Ramesh (Captain)',
      guestCount: 3,
      currentOrderId: 'ord_1',
    },
    {
      id: 'tbl_2',
      tableNumber: 'T-02',
      name: 'Table 2',
      areaId: 'area_1',
      capacity: 2,
      status: TABLE_STATUS.VACANT,
      runningAmount: 0,
      elapsedMinutes: 0,
    },
    {
      id: 'tbl_3',
      tableNumber: 'T-03',
      name: 'Table 3',
      areaId: 'area_1',
      capacity: 6,
      status: TABLE_STATUS.BILLED,
      runningAmount: 185000,
      elapsedMinutes: 62,
      captainName: 'Suresh (Captain)',
      guestCount: 5,
      currentOrderId: 'ord_2',
    },
    {
      id: 'tbl_4',
      tableNumber: 'T-04',
      name: 'Table 4',
      areaId: 'area_1',
      capacity: 4,
      status: TABLE_STATUS.VACANT,
      runningAmount: 0,
      elapsedMinutes: 0,
    },
    {
      id: 'tbl_5',
      tableNumber: 'T-05',
      name: 'Table 5',
      areaId: 'area_2',
      capacity: 4,
      status: TABLE_STATUS.OCCUPIED,
      runningAmount: 72000,
      elapsedMinutes: 20,
      captainName: 'Ramesh (Captain)',
      guestCount: 2,
      currentOrderId: 'ord_3',
    },
    {
      id: 'tbl_6',
      tableNumber: 'T-06',
      name: 'Table 6',
      areaId: 'area_2',
      capacity: 8,
      status: TABLE_STATUS.RESERVED,
      runningAmount: 0,
      elapsedMinutes: 0,
      guestCount: 6,
    },
    {
      id: 'tbl_7',
      tableNumber: 'T-07',
      name: 'Table 7',
      areaId: 'area_3',
      capacity: 4,
      status: TABLE_STATUS.VACANT,
      runningAmount: 0,
      elapsedMinutes: 0,
    },
    {
      id: 'tbl_8',
      tableNumber: 'T-08',
      name: 'Table 8',
      areaId: 'area_3',
      capacity: 4,
      status: TABLE_STATUS.OCCUPIED,
      runningAmount: 124000,
      elapsedMinutes: 45,
      captainName: 'Suresh (Captain)',
      guestCount: 4,
      currentOrderId: 'ord_4',
    },
  ]);

  const filteredTables = tables.filter((t) => {
    const matchesArea = selectedArea === 'ALL' || t.areaId === selectedArea;
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tableNumber.toLowerCase().includes(search.toLowerCase());
    return matchesArea && matchesStatus && matchesSearch;
  });

  const vacantCount = tables.filter((t) => t.status === TABLE_STATUS.VACANT).length;
  const occupiedCount = tables.filter((t) => t.status === TABLE_STATUS.OCCUPIED).length;
  const billedCount = tables.filter((t) => t.status === TABLE_STATUS.BILLED).length;
  const totalRunningSales = tables.reduce((acc, t) => acc + (t.runningAmount || 0), 0);

  const getStatusBorder = (status) => {
    switch (status) {
      case TABLE_STATUS.VACANT:
        return 'border-emerald-500/40 hover:border-emerald-500 bg-emerald-500/5';
      case TABLE_STATUS.OCCUPIED:
        return 'border-blue-500/50 hover:border-blue-500 bg-blue-500/5 shadow-blue-500/10 shadow-lg';
      case TABLE_STATUS.BILLED:
        return 'border-amber-500/50 hover:border-amber-500 bg-amber-500/5 shadow-amber-500/10 shadow-lg';
      case TABLE_STATUS.RESERVED:
        return 'border-purple-500/40 hover:border-purple-500 bg-purple-500/5';
      default:
        return 'border-slate-800 bg-slate-900/50';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case TABLE_STATUS.VACANT:
        return <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">VACANT</Badge>;
      case TABLE_STATUS.OCCUPIED:
        return <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-500/10">OCCUPIED</Badge>;
      case TABLE_STATUS.BILLED:
        return <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10">BILLED</Badge>;
      case TABLE_STATUS.RESERVED:
        return <Badge variant="outline" className="border-purple-500/40 text-purple-400 bg-purple-500/10">RESERVED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleTableClick = (table) => {
    if (table.status === TABLE_STATUS.VACANT) {
      navigate(`/orders?tableId=${table.id}&tableName=${encodeURIComponent(table.name)}`);
    } else if (table.status === TABLE_STATUS.OCCUPIED) {
      navigate(`/orders?tableId=${table.id}&orderId=${table.currentOrderId}`);
    } else {
      navigate(`/orders?tableId=${table.id}`);
    }
  };

  const handleTransfer = (targetTableId) => {
    if (!transferModal) return;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === transferModal.id) {
          return {
            ...t,
            status: TABLE_STATUS.VACANT,
            runningAmount: 0,
            elapsedMinutes: 0,
            guestCount: undefined,
            captainName: undefined,
            currentOrderId: undefined,
          };
        }
        if (t.id === targetTableId) {
          return {
            ...t,
            status: TABLE_STATUS.OCCUPIED,
            runningAmount: transferModal.runningAmount,
            elapsedMinutes: transferModal.elapsedMinutes,
            guestCount: transferModal.guestCount,
            captainName: transferModal.captainName,
            currentOrderId: transferModal.currentOrderId,
          };
        }
        return t;
      })
    );
    setTransferModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-emerald-400" />
            Floor View & Table Management
          </h1>
          <p className="text-sm text-slate-400">Live floor state, running orders, and table allocations</p>
        </div>

        {/* Quick Stats Banner */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg p-2.5">
          <div className="px-3 border-r border-slate-800 text-center">
            <p className="text-xs text-slate-400">Vacant</p>
            <p className="text-lg font-bold text-emerald-400">{vacantCount}</p>
          </div>
          <div className="px-3 border-r border-slate-800 text-center">
            <p className="text-xs text-slate-400">Occupied</p>
            <p className="text-lg font-bold text-blue-400">{occupiedCount}</p>
          </div>
          <div className="px-3 border-r border-slate-800 text-center">
            <p className="text-xs text-slate-400">Billed</p>
            <p className="text-lg font-bold text-amber-400">{billedCount}</p>
          </div>
          <div className="px-3 text-center">
            <p className="text-xs text-slate-400">Active Sales</p>
            <p className="text-lg font-bold text-white flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5" />
              {formatPaiseToRupees(totalRunningSales)}
            </p>
          </div>
        </div>
      </div>

      {/* Area Tabs & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <Button
            size="sm"
            variant={selectedArea === 'ALL' ? 'default' : 'ghost'}
            onClick={() => setSelectedArea('ALL')}
            className={selectedArea === 'ALL' ? 'bg-emerald-600 hover:bg-emerald-500' : ''}
          >
            All Areas ({tables.length})
          </Button>
          {areas.map((a) => (
            <Button
              key={a.id}
              size="sm"
              variant={selectedArea === a.id ? 'default' : 'ghost'}
              onClick={() => setSelectedArea(a.id)}
              className={selectedArea === a.id ? 'bg-emerald-600 hover:bg-emerald-500' : ''}
            >
              {a.name}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <Input
              placeholder="Search table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-slate-950 border-slate-800 text-sm"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['ALL', TABLE_STATUS.VACANT, TABLE_STATUS.OCCUPIED, TABLE_STATUS.BILLED].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedStatus === st
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const isOccupied = table.status === TABLE_STATUS.OCCUPIED;
          const isBilled = table.status === TABLE_STATUS.BILLED;
          const isVacant = table.status === TABLE_STATUS.VACANT;

          return (
            <Card
              key={table.id}
              className={`border-2 transition-all duration-200 cursor-pointer ${getStatusBorder(
                table.status
              )}`}
              onClick={() => handleTableClick(table)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white">{table.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {table.capacity} Seater {table.guestCount ? `• (${table.guestCount} Guests)` : ''}
                    </p>
                  </div>
                  {getStatusBadge(table.status)}
                </div>

                {/* Running Order Details */}
                {(isOccupied || isBilled) && (
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {table.elapsedMinutes} mins
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        ₹{formatPaiseToRupees(table.runningAmount)}
                      </span>
                    </div>
                    {table.captainName && (
                      <p className="text-[11px] text-slate-400 truncate">
                        Assigned: {table.captainName}
                      </p>
                    )}
                  </div>
                )}

                {isVacant && (
                  <div className="py-4 text-center">
                    <p className="text-xs text-slate-500">Tap to start order</p>
                  </div>
                )}

                {/* Action Row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60" onClick={(e) => e.stopPropagation()}>
                  {isVacant ? (
                    <Button
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-xs h-8 gap-1.5"
                      onClick={() => handleTableClick(table)}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Open Table & Order
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 text-xs h-8"
                        onClick={() => handleTableClick(table)}
                      >
                        {isBilled ? 'View Bill' : 'Manage Order'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-slate-400 hover:text-white"
                        title="Transfer Table"
                        onClick={() => setTransferModal(table)}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table Transfer Modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">
                  Transfer from {transferModal.name}
                </h3>
              </div>
              <p className="text-sm text-slate-400">
                Select a vacant destination table to transfer the active session and orders:
              </p>

              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {tables
                  .filter((t) => t.status === TABLE_STATUS.VACANT)
                  .map((vacantTable) => (
                    <Button
                      key={vacantTable.id}
                      variant="outline"
                      className="justify-start gap-2 h-12 border-slate-800 hover:border-emerald-500 hover:bg-emerald-500/10"
                      onClick={() => handleTransfer(vacantTable.id)}
                    >
                      <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-white">{vacantTable.name}</p>
                        <p className="text-[10px] text-slate-500">{vacantTable.capacity} Seater</p>
                      </div>
                    </Button>
                  ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="ghost" onClick={() => setTransferModal(null)}>
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
