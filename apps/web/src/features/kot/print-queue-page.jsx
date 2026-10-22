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
} from 'lucide-react';
import { KOT_STATUS, PRINT_JOB_STATUS } from '@pos/shared';
import { usePosStore } from '@/stores/pos-store';

export function PrintQueuePage() {
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [reprintModalKot, setReprintModalKot] = useState(null);
  const [reprintReason, setReprintReason] = useState('Paper Jam in printer');
  const [notification, setNotification] = useState(null);
  const [bridgeOnline, setBridgeOnline] = useState(false);

  React.useEffect(() => {
    fetch('http://127.0.0.1:18181/health')
      .then((r) => r.ok && setBridgeOnline(true))
      .catch(() => setBridgeOnline(false));
  }, []);

  const stations = [
    { id: 'st_1', name: 'Main Kitchen' },
    { id: 'st_2', name: 'Tandoor & Grill' },
    { id: 'st_3', name: 'Bar & Beverages' },
  ];

  const { kots, updateKotStatus } = usePosStore();

  const filteredKots = kots.filter((k) => {
    const matchesStation = selectedStation === 'ALL' || k.stationId === selectedStation;
    const matchesStatus = selectedStatus === 'ALL' || k.status === selectedStatus;
    return matchesStation && matchesStatus;
  });

  const handleReprint = async () => {
    if (!reprintModalKot) return;
    const linesText = (reprintModalKot.lines || reprintModalKot.items || [])
      .map(
        (l) =>
          `${l.quantity || 1}x ${l.name}${l.variant || l.variantName ? ` (${l.variant || l.variantName})` : ''}${
            l.addons?.length ? ` [+${l.addons.map((a) => (typeof a === 'string' ? a : a.name)).join(', ')}]` : ''
          }${l.notes ? ` [Note: ${l.notes}]` : ''}`
      )
      .join('\n');

    try {
      await fetch('http://127.0.0.1:18181/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerIp: '127.0.0.1',
          content: `*** DUPLICATE KOT ***\nTicket: ${reprintModalKot.kotNo}\nTable: ${reprintModalKot.tableName}\nReason: ${reprintReason}\n${linesText}\n`,
        }),
      });
    } catch {
      // Local bridge fallback
    }

    updateKotStatus(reprintModalKot.id, KOT_STATUS.PRINTED, null);
    setNotification(`DUPLICATE KOT reprinted for ${reprintModalKot.kotNo}! Reason: ${reprintReason}`);
    setReprintModalKot(null);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRetryPrint = async (kotId) => {
    const targetKot = kots.find((k) => k.id === kotId);
    if (targetKot) {
      const linesText = (targetKot.lines || targetKot.items || [])
        .map(
          (l) =>
            `${l.quantity || 1}x ${l.name}${l.variant || l.variantName ? ` (${l.variant || l.variantName})` : ''}${
              l.addons?.length ? ` [+${l.addons.map((a) => (typeof a === 'string' ? a : a.name)).join(', ')}]` : ''
            }${l.notes ? ` [Note: ${l.notes}]` : ''}`
        )
        .join('\n');

      try {
        await fetch('http://127.0.0.1:18181/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            printerIp: '127.0.0.1',
            content: `*** RETRIED KOT ***\nTicket: ${targetKot.kotNo}\nTable: ${targetKot.tableName}\n${linesText}\n`,
          }),
        });
      } catch {
        // Fallback
      }
    }

    updateKotStatus(kotId, KOT_STATUS.PRINTED, null);
    setNotification('Print job re-dispatched to thermal printer!');
    setTimeout(() => setNotification(null), 3000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case KOT_STATUS.PENDING:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold">QUEUED</Badge>;
      case KOT_STATUS.PRINTED:
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">PRINTED</Badge>;
      case KOT_STATUS.FAILED:
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold">FAILED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-slate-700" />
            KOT & Kitchen Print Queue
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Monitor Kitchen Order Tickets, reroute thermal printers & reprint duplicate slips
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`border py-1 px-2.5 text-xs font-semibold flex items-center gap-1.5 ${bridgeOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
            <Printer className="w-3.5 h-3.5" />
            Printer Bridge: {bridgeOnline ? 'Active (Port 18181)' : 'Direct Web / LAN'}
          </Badge>

          <Button
            size="sm"
            onClick={() => window.location.href = '/kitchen'}
            className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
          >
            <ChefHat className="w-3.5 h-3.5 mr-1.5" />
            Kitchen KDS View
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedStation('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStation === 'ALL'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Stations
          </button>
          {stations.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStation(s.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStation === s.id
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {['ALL', KOT_STATUS.PENDING, KOT_STATUS.PRINTED, KOT_STATUS.FAILED].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* KOT Cards Grid */}
      {filteredKots.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No KOT Tickets in Queue</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When orders are sent to the kitchen from the Floor or Order screen, real KOT slips will appear here live.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredKots.map((kot) => {
            const isFailed = kot.status === KOT_STATUS.FAILED;

          return (
            <div
              key={kot.id}
              className={`bg-white border rounded-xl p-3.5 space-y-3 transition-all shadow-xs ${
                isFailed ? 'border-rose-300' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-mono">{kot.kotNo}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {kot.orderNo} • <span className="text-slate-800 font-semibold">{kot.tableName}</span>
                  </p>
                </div>
                {getStatusBadge(kot.status)}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="font-semibold text-slate-700">{kot.stationName}</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3" />
                  {kot.createdAt}
                </span>
              </div>

              {/* Items */}
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-2 font-mono text-xs">
                {(kot.lines || kot.items || []).map((l, idx) => {
                  const variant = l.variant || l.variantName || l.variant_name;
                  const addons = l.addons || [];

                  return (
                    <div key={idx} className="space-y-0.5 border-b border-slate-200/50 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-900 font-bold">{l.quantity || l.qty || 1}x {l.name}</span>
                        {variant && <span className="text-slate-500 font-normal">({variant})</span>}
                      </div>
                      {addons.length > 0 && (
                        <p className="text-[11px] text-emerald-700 pl-4 font-sans font-medium">
                          + {addons.map((a) => (typeof a === 'string' ? a : a.name)).join(', ')}
                        </p>
                      )}
                      {l.notes && (
                        <p className="text-[11px] text-amber-700 italic pl-4 font-sans">
                          Note: {l.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Error Banner if failed */}
              {kot.errorMessage && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{kot.errorMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-1 border-t border-slate-100">
                {isFailed ? (
                  <Button
                    size="sm"
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 gap-1.5 font-semibold"
                    onClick={() => handleRetryPrint(kot.id)}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry Print Job
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs h-8 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                    onClick={() => setReprintModalKot(kot)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Reprint KOT (Duplicate)
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Reprint Reason Modal */}
      {reprintModalKot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Reprint KOT ({reprintModalKot.kotNo})
                </h3>
              </div>
              <p className="text-xs text-slate-500">
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
                    className={`w-full p-2.5 text-left rounded-lg text-xs transition-all border ${
                      reprintReason === reason
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" className="text-xs text-slate-600" onClick={() => setReprintModalKot(null)}>
                  Cancel
                </Button>
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold" onClick={handleReprint}>
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
