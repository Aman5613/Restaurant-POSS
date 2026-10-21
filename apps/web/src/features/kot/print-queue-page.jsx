import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Printer,
  ChefHat,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  Search,
} from 'lucide-react';
import { KOT_STATUS, PRINT_JOB_STATUS } from '@pos/shared';

export function PrintQueuePage() {
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [reprintModalKot, setReprintModalKot] = useState(null);
  const [reprintReason, setReprintReason] = useState('Paper Jam in printer');
  const [notification, setNotification] = useState(null);

  const stations = [
    { id: 'st_1', name: 'Main Kitchen' },
    { id: 'st_2', name: 'Tandoor & Grill' },
    { id: 'st_3', name: 'Bar & Beverages' },
  ];

  const [kots, setKots] = useState([
    {
      id: 'kot_1',
      kotNo: 'KOT-0041',
      orderNo: 'ORD-0041',
      tableName: 'Table 1',
      stationId: 'st_1',
      stationName: 'Main Kitchen',
      status: KOT_STATUS.PRINTED,
      createdAt: '10 mins ago',
      lines: [
        { name: 'Paneer Butter Masala', variant: 'Full', quantity: 1, notes: 'Medium spice' },
        { name: 'Dal Makhani', variant: null, quantity: 1, notes: 'Extra butter' },
      ],
    },
    {
      id: 'kot_2',
      kotNo: 'KOT-0042',
      orderNo: 'ORD-0041',
      tableName: 'Table 1',
      stationId: 'st_2',
      stationName: 'Tandoor & Grill',
      status: KOT_STATUS.PENDING,
      createdAt: '9 mins ago',
      lines: [
        { name: 'Butter Naan', variant: null, quantity: 4, notes: 'Crispy' },
        { name: 'Paneer Tikka', variant: 'Full', quantity: 1, notes: '' },
      ],
    },
    {
      id: 'kot_3',
      kotNo: 'KOT-0043',
      orderNo: 'ORD-0043',
      tableName: 'Counter (Takeaway)',
      stationId: 'st_1',
      stationName: 'Main Kitchen',
      status: KOT_STATUS.FAILED,
      createdAt: '4 mins ago',
      errorMessage: 'Printer connection timeout (192.168.1.150)',
      lines: [
        { name: 'Chicken Biryani', variant: 'Full', quantity: 2, notes: 'Pack with extra raita' },
      ],
    },
  ]);

  const filteredKots = kots.filter((k) => {
    const matchesStation = selectedStation === 'ALL' || k.stationId === selectedStation;
    const matchesStatus = selectedStatus === 'ALL' || k.status === selectedStatus;
    return matchesStation && matchesStatus;
  });

  const handleReprint = () => {
    if (!reprintModalKot) return;
    setNotification(`DUPLICATE KOT reprinted for ${reprintModalKot.kotNo}! Reason: ${reprintReason}`);
    setReprintModalKot(null);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRetryPrint = (kotId) => {
    setKots((prev) =>
      prev.map((k) =>
        k.id === kotId ? { ...k, status: KOT_STATUS.PRINTED, errorMessage: null } : k
      )
    );
    setNotification('Print job re-dispatched to thermal printer!');
    setTimeout(() => setNotification(null), 3000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case KOT_STATUS.PENDING:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">QUEUED</Badge>;
      case KOT_STATUS.PRINTED:
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">PRINTED</Badge>;
      case KOT_STATUS.FAILED:
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/40">FAILED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-emerald-400" />
            KOT & Kitchen Print Queue
          </h1>
          <p className="text-sm text-slate-400">
            Monitor Kitchen Order Tickets, reroute thermal printers & reprint duplicate slips
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-slate-800 text-slate-300 border-slate-700 py-1.5 px-3 flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-emerald-400" />
            Printer Bridge: Online
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Button
            size="sm"
            variant={selectedStation === 'ALL' ? 'default' : 'ghost'}
            onClick={() => setSelectedStation('ALL')}
            className={selectedStation === 'ALL' ? 'bg-emerald-600 hover:bg-emerald-500' : ''}
          >
            All Stations
          </Button>
          {stations.map((s) => (
            <Button
              key={s.id}
              size="sm"
              variant={selectedStation === s.id ? 'default' : 'ghost'}
              onClick={() => setSelectedStation(s.id)}
              className={selectedStation === s.id ? 'bg-emerald-600 hover:bg-emerald-500' : ''}
            >
              {s.name}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {['ALL', KOT_STATUS.PENDING, KOT_STATUS.PRINTED, KOT_STATUS.FAILED].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                selectedStatus === st
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* KOT Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredKots.map((kot) => {
          const isFailed = kot.status === KOT_STATUS.FAILED;

          return (
            <Card
              key={kot.id}
              className={`bg-slate-900 border transition-all ${
                isFailed ? 'border-rose-500/60 shadow-lg shadow-rose-950/20' : 'border-slate-800'
              }`}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-white text-base font-mono">{kot.kotNo}</h3>
                    <p className="text-xs text-slate-400">
                      {kot.orderNo} • <span className="text-emerald-400 font-semibold">{kot.tableName}</span>
                    </p>
                  </div>
                  {getStatusBadge(kot.status)}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">{kot.stationName}</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    {kot.createdAt}
                  </span>
                </div>

                {/* Items */}
                <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/80 space-y-1.5 font-mono text-xs">
                  {kot.lines.map((l, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-2">
                      <span className="text-white font-bold">{l.quantity}x {l.name}</span>
                      {l.variant && <span className="text-slate-400">({l.variant})</span>}
                    </div>
                  ))}
                  {kot.lines.some((l) => l.notes) && (
                    <div className="pt-1 text-[11px] text-amber-400/90 italic font-sans">
                      {kot.lines.filter((l) => l.notes).map((l, i) => (
                        <p key={i}>Note: {l.notes}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error Banner if failed */}
                {kot.errorMessage && (
                  <div className="p-2 rounded bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{kot.errorMessage}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  {isFailed ? (
                    <Button
                      size="sm"
                      className="w-full bg-rose-600 hover:bg-rose-500 text-xs h-8 gap-1.5"
                      onClick={() => handleRetryPrint(kot.id)}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retry Print Job
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-8 gap-1.5 border-slate-800 hover:border-slate-700"
                      onClick={() => setReprintModalKot(kot)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Reprint KOT (Duplicate)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Reprint Reason Modal */}
      {reprintModalKot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">
                  Reprint KOT ({reprintModalKot.kotNo})
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                A duplicate watermarked slip will be printed for kitchen tracking. Please select a reason for the audit trail:
              </p>

              <div className="space-y-1.5">
                {[
                  'Paper Jam in printer',
                  'Ticket misplaced by chef/waiter',
                  'Faded thermal print / unreadable',
                  'Station rerouted to backup printer',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setReprintReason(reason)}
                    className={`w-full p-2.5 text-left rounded text-xs transition-all border ${
                      reprintReason === reason
                        ? 'bg-amber-500/20 border-amber-500 text-white font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="ghost" onClick={() => setReprintModalKot(null)}>
                  Cancel
                </Button>
                <Button className="bg-amber-600 hover:bg-amber-500 text-white" onClick={handleReprint}>
                  Print Duplicate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
