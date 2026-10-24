import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Volume2,
  UtensilsCrossed,
  Flame,
  Check,
  RefreshCw,
  Filter,
  VolumeX,
  Printer,
  Copy,
} from 'lucide-react';
import { usePosStore } from '@/stores/pos-store';
import { useAuthStore } from '@/stores/auth-store';
import { useSocket } from '@/hooks/use-socket';
import { playKotChime, playReadyChime, startKotRinger, stopKotRinger } from '@/lib/sound-effects';
import { apiClient } from '@/lib/api-client';

export function KitchenDisplayPage() {
  const { user } = useAuthStore();
  const { kots, updateKotStatus } = usePosStore();
  const { acknowledgeKot, markKotReady, isConnected } = useSocket();

  const [selectedStation, setSelectedStation] = useState('ALL');
  const [selectedFilter, setSelectedFilter] = useState('ACTIVE'); // 'ALL' | 'ACTIVE' | 'PENDING' | 'PREPARING' | 'READY'
  const [notification, setNotification] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isMuted, setIsMuted] = useState(false);
  const [reprintModalKot, setReprintModalKot] = useState(null);
  const [reprintReason, setReprintReason] = useState('Paper Jam in printer');

  // Unacknowledged tickets awaiting chef action
  const unacknowledgedKots = useMemo(() => {
    return (kots || []).filter((k) => {
      const status = (k.status || 'PENDING').toUpperCase();
      return status === 'PENDING' || status === 'QUEUED' || status === 'PRINTED';
    });
  }, [kots]);

  const unacknowledgedCount = unacknowledgedKots.length;

  // Ring the kitchen alarm continuously until all tickets are acknowledged or muted
  useEffect(() => {
    if (unacknowledgedCount > 0 && !isMuted) {
      startKotRinger(4500);
    } else {
      stopKotRinger();
    }
    return () => {
      stopKotRinger();
    };
  }, [unacknowledgedCount, isMuted]);

  // Clock tick every 10 seconds for ticket elapsed timers
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const stations = [
    { id: 'ALL', name: 'All Kitchen Stations' },
    { id: 'st_1', name: 'Main Kitchen' },
    { id: 'st_2', name: 'Tandoor & Grill' },
    { id: 'st_3', name: 'Bar & Beverages' },
  ];

  const notify = (msg, type = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAcknowledge = async (kot) => {
    const targetId = kot._id || kot.id;
    try {
      if (kot._id) {
        await apiClient.post(`/v1/kot/${kot._id}/acknowledge`);
      }
    } catch (_err) {
      // Local fallback
    }

    acknowledgeKot(targetId);
    notify(`KOT #${kot.kotNo || targetId} acknowledged — Preparation started!`);
  };

  const handleAcknowledgeAll = async () => {
    for (const kot of unacknowledgedKots) {
      const targetId = kot._id || kot.id;
      try {
        if (kot._id) {
          apiClient.post(`/v1/kot/${kot._id}/acknowledge`).catch(() => {});
        }
      } catch (_err) {
        // Local fallback
      }
      acknowledgeKot(targetId);
    }
    stopKotRinger();
    notify(`All ${unacknowledgedCount} incoming KOT tickets acknowledged! Alarm silenced.`);
  };

  const handleMarkReady = async (kot) => {
    const targetId = kot._id || kot.id;
    try {
      if (kot._id) {
        await apiClient.post(`/v1/kot/${kot._id}/ready`);
      }
    } catch (_err) {
      // Local fallback
    }

    const dishSummary = (kot.lines || kot.items || [])
      .map((l) => `${l.quantity || 1}x ${l.name}`)
      .slice(0, 3)
      .join(', ');

    markKotReady(targetId, {
      tableNumber: kot.tableName || kot.tableNumber || 'Table',
      itemName: dishSummary || 'Order',
      kotNumber: kot.kotNo || targetId,
    });
    playReadyChime();
    notify(`KOT #${kot.kotNo || targetId} marked READY! Pickup alert sent to Captains.`);
  };

  const handleReprint = async () => {
    if (!reprintModalKot) return;
    const linesText = (reprintModalKot.lines || reprintModalKot.items || [])
      .map(
        (l) =>
          `${l.quantity || l.qty || 1}x ${l.name}${l.variant || l.variantName ? ` (${l.variant || l.variantName})` : ''}${
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
          content: `*** DUPLICATE KOT (KDS) ***\nTicket: ${reprintModalKot.kotNo}\nTable: ${reprintModalKot.tableName}\nReason: ${reprintReason}\n${linesText}\n`,
        }),
      });
    } catch {
      // Local bridge fallback
    }

    notify(`Duplicate KOT slip printed for ${reprintModalKot.kotNo || 'Ticket'}!`);
    setReprintModalKot(null);
  };

  // Filtered KOT tickets
  const filteredKots = useMemo(() => {
    return (kots || []).filter((k) => {
      const matchStation = selectedStation === 'ALL' || k.stationId === selectedStation;
      const status = (k.status || 'PENDING').toUpperCase();

      if (selectedFilter === 'ACTIVE') {
        return matchStation && status !== 'CANCELLED' && status !== 'COMPLETED';
      }
      if (selectedFilter === 'PENDING') {
        return matchStation && (status === 'PENDING' || status === 'QUEUED' || status === 'PRINTED');
      }
      if (selectedFilter === 'PREPARING') {
        return matchStation && (status === 'PREPARING' || status === 'COOKING');
      }
      if (selectedFilter === 'READY') {
        return matchStation && status === 'READY';
      }
      return matchStation;
    });
  }, [kots, selectedStation, selectedFilter]);

  const pendingCount = (kots || []).filter(
    (k) => (k.status || 'PENDING').toUpperCase() === 'PENDING' || (k.status || '').toUpperCase() === 'PRINTED'
  ).length;

  const preparingCount = (kots || []).filter(
    (k) => (k.status || '').toUpperCase() === 'PREPARING' || (k.status || '').toUpperCase() === 'COOKING'
  ).length;

  const readyCount = (kots || []).filter(
    (k) => (k.status || '').toUpperCase() === 'READY'
  ).length;

  const getElapsedMinutes = (createdAt) => {
    if (!createdAt) return 0;
    const diffMs = currentTime - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const getUrgencyClass = (mins) => {
    if (mins >= 20) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (mins >= 12) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 select-none">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg border animate-in fade-in ${
            notification.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Kitchen Display System (KDS)
                </h1>
                <Badge className="bg-amber-600 text-white text-[10px] uppercase font-bold tracking-wider">
                  Live Cooking Queue
                </Badge>
                {isConnected ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Socket Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Local Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time tickets with audio notification, one-click chef acknowledgment, and food ready dispatches
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={playKotChime}
            className="h-9 px-3 text-xs border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
            title="Test Kitchen Bell Sound"
          >
            <Bell className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
            Test Bell
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={playReadyChime}
            className="h-9 px-3 text-xs border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
            title="Test Food Ready Chime"
          >
            <Volume2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Test Ready Chime
          </Button>
        </div>
      </div>

      {/* Persistent Alarm Ringing Banner */}
      {unacknowledgedCount > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 animate-bounce">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-rose-900 text-sm tracking-tight">
                  🔔 NEW KOT RINGING ALARM ACTIVE
                </span>
                <Badge className="bg-rose-600 text-white text-[10px] font-bold">
                  {unacknowledgedCount} UNACKNOWLEDGED
                </Badge>
              </div>
              <p className="text-xs text-rose-700 font-medium mt-0.5">
                Kitchen bell continues ringing periodically until chef acknowledges the ticket(s).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsMuted((prev) => !prev)}
              className="h-8 px-2.5 text-xs border-rose-300 bg-white hover:bg-rose-50 text-rose-800 font-semibold"
            >
              {isMuted ? <Volume2 className="w-3.5 h-3.5 mr-1" /> : <VolumeX className="w-3.5 h-3.5 mr-1" />}
              {isMuted ? 'Unmute Bell' : 'Mute Sound'}
            </Button>
            <Button
              size="sm"
              onClick={handleAcknowledgeAll}
              className="h-8 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Acknowledge All ({unacknowledgedCount})
            </Button>
          </div>
        </div>
      )}

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <button
          onClick={() => setSelectedFilter('PENDING')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedFilter === 'PENDING'
              ? 'bg-amber-50 border-amber-300 shadow-xs ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold uppercase text-amber-700">New / Unacknowledged</span>
            <Bell className={`w-4 h-4 text-amber-600 ${pendingCount > 0 ? 'animate-bounce' : ''}`} />
          </div>
          <p className="text-2xl font-black text-amber-900">{pendingCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Awaiting chef review</p>
        </button>

        <button
          onClick={() => setSelectedFilter('PREPARING')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedFilter === 'PREPARING'
              ? 'bg-sky-50 border-sky-300 shadow-xs ring-2 ring-sky-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold uppercase text-sky-700">On The Stove / Cooking</span>
            <Flame className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-sky-900">{preparingCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Currently in preparation</p>
        </button>

        <button
          onClick={() => setSelectedFilter('READY')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedFilter === 'READY'
              ? 'bg-emerald-50 border-emerald-300 shadow-xs ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold uppercase text-emerald-700">Food Ready (Pickup)</span>
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{readyCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Waiting for captains</p>
        </button>

        <button
          onClick={() => setSelectedFilter('ACTIVE')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedFilter === 'ACTIVE'
              ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between pb-1">
            <span
              className={`text-[11px] font-bold uppercase ${
                selectedFilter === 'ACTIVE' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              All Active Tickets
            </span>
            <ChefHat className="w-4 h-4" />
          </div>
          <p
            className={`text-2xl font-black ${
              selectedFilter === 'ACTIVE' ? 'text-white' : 'text-slate-900'
            }`}
          >
            {pendingCount + preparingCount + readyCount}
          </p>
          <p
            className={`text-[10px] mt-0.5 ${
              selectedFilter === 'ACTIVE' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Total in-flight orders
          </p>
        </button>
      </div>

      {/* Station Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {stations.map((st) => (
          <button
            key={st.id}
            onClick={() => setSelectedStation(st.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedStation === st.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {st.name}
          </button>
        ))}
      </div>

      {/* Live Kitchen Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKots.map((kot) => {
          const status = (kot.status || 'PENDING').toUpperCase();
          const isPending = status === 'PENDING' || status === 'PRINTED' || status === 'QUEUED';
          const isPreparing = status === 'PREPARING' || status === 'COOKING';
          const isReady = status === 'READY';
          const elapsedMins = getElapsedMinutes(kot.createdAt || kot.timestamp);
          const kotLines = kot.lines || kot.items || [];
          const totalQty = kotLines.reduce((sum, l) => sum + (l.quantity || l.qty || 1), 0);

          return (
            <Card
              key={kot.id || kot._id}
              className={`border-2 transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                isPending
                  ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/10 animate-in zoom-in-95'
                  : isPreparing
                  ? 'border-sky-300 bg-white ring-1 ring-sky-200'
                  : isReady
                  ? 'border-emerald-300 bg-emerald-50/10'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Token Header Banner */}
              <div
                className={`p-3.5 border-b flex items-center justify-between ${
                  isPending
                    ? 'bg-amber-100/70 border-amber-300'
                    : isPreparing
                    ? 'bg-sky-50 border-sky-200'
                    : isReady
                    ? 'bg-emerald-100/70 border-emerald-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-base text-slate-900 tracking-tight">
                      {kot.kotNo || `KOT-${String(kot.id || '').slice(-4)}`}
                    </span>
                    <Badge
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        isPending
                          ? 'bg-amber-600 text-white'
                          : isPreparing
                          ? 'bg-sky-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {status}
                    </Badge>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    <span>{kot.tableName || `Table ${kot.tableId || 'Counter'}`}</span>
                    {kot.orderNo && (
                      <span className="text-[11px] font-medium text-slate-500 font-mono">
                        • {kot.orderNo}
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold ${getUrgencyClass(
                      elapsedMins
                    )}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsedMins}m</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                    {kot.createdAt || 'Just now'}
                  </span>
                </div>
              </div>

              {/* Station & Token Meta Strip */}
              <div className="px-3.5 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-slate-500" />
                  {kot.stationName || 'Main Kitchen'}
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-medium">
                  {kotLines.length} Item{kotLines.length > 1 ? 's' : ''} • {totalQty} Qty
                </span>
              </div>

              {/* Token Lines Receipt Box */}
              <CardContent className="p-3.5 flex-1 space-y-2">
                <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 space-y-2 font-mono text-xs">
                  {kotLines.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px] text-center py-2 font-sans">
                      No line items in this ticket
                    </p>
                  ) : (
                    kotLines.map((line, idx) => {
                      const qty = line.quantity || line.qty || 1;
                      const variantName = line.variant || line.variantName;
                      const lineNotes = line.notes || line.instruction;
                      const addons = line.addons || [];

                      return (
                        <div
                          key={line.id || idx}
                          className="pb-2 border-b border-slate-200/60 last:border-0 last:pb-0"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <span className="bg-slate-900 text-white text-[11px] font-black px-1.5 py-0.5 rounded leading-none shrink-0 mt-0.5">
                                {qty}x
                              </span>
                              <div>
                                <span className="font-bold text-slate-900 text-xs">
                                  {line.name}
                                </span>
                                {variantName && (
                                  <span className="text-slate-500 font-normal ml-1">
                                    ({variantName})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {addons.length > 0 && (
                            <div className="pl-7 pt-1 font-sans">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
                                + {addons.map((a) => (typeof a === 'string' ? a : a.name)).join(', ')}
                              </span>
                            </div>
                          )}

                          {lineNotes && (
                            <div className="mt-1 ml-7 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px] italic font-sans flex items-center gap-1">
                              <span>Note: {lineNotes}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>

              {/* Action Buttons */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs text-slate-500 hover:text-slate-800 gap-1 font-semibold"
                  onClick={() => setReprintModalKot(kot)}
                  title="Reprint Duplicate Slip"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reprint</span>
                </Button>

                <div className="flex items-center gap-2">
                  {isPending && (
                    <Button
                      size="sm"
                      onClick={() => handleAcknowledge(kot)}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-8 px-3 shadow-xs animate-pulse gap-1.5"
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      Acknowledge & Cook
                    </Button>
                  )}

                  {isPreparing && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkReady(kot)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 px-3 shadow-xs gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark Ready (Pickup)
                    </Button>
                  )}

                  {isReady && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Ready for Pickup
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredKots.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-2 stroke-1" />
          <h3 className="text-base font-bold text-slate-800">Kitchen Queue is Clear!</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All tickets have been prepared. New orders punched by captains or billers will arrive here automatically with an audio chime.
          </p>
        </div>
      )}

      {/* Reprint Reason Modal */}
      {reprintModalKot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border-slate-200 shadow-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Reprint KOT Token ({reprintModalKot.kotNo || 'Slip'})
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

export default KitchenDisplayPage;
