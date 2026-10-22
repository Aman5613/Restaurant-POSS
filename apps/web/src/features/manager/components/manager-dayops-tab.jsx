import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { formatPaiseToRupees } from '@pos/shared';
import { usePosStore } from '@/stores/pos-store';
import { apiClient } from '@/lib/api-client';

export function ManagerDayOpsTab({ onNotify }) {
  const { dayOps, openDay, closeDay, recordCashMovement, invoices } = usePosStore();

  const isDayOpen = (dayOps?.status || 'OPEN') === 'OPEN';

  // Forms
  const [openingFloatRupees, setOpeningFloatRupees] = useState('5000');
  const [openNotes, setOpenNotes] = useState('');
  const [countedCashRupees, setCountedCashRupees] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  // Cash movement form
  const [movType, setMovType] = useState('CASH_OUT');
  const [movAmountRupees, setMovAmountRupees] = useState('');
  const [movReason, setMovReason] = useState('');
  const [isMovModalOpen, setIsMovModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  // Calculate Cash Sales Today
  const cashSalesPaise = Object.values(invoices || {}).reduce((acc, inv) => {
    const isCash = (inv.paymentModes || []).some(
      (pm) => (pm.mode || pm.type || '').toUpperCase() === 'CASH'
    ) || (inv.paymentMode || '').toUpperCase() === 'CASH';
    return isCash ? acc + (inv.grandTotal || 0) : acc;
  }, 0);

  const movements = dayOps?.movements || [];
  const totalCashInPaise = movements
    .filter((m) => m.type === 'CASH_IN')
    .reduce((acc, m) => acc + (m.amount || 0), 0);
  const totalCashOutPaise = movements
    .filter((m) => m.type === 'CASH_OUT' || m.type === 'CASH_DROP')
    .reduce((acc, m) => acc + (m.amount || 0), 0);

  const openingFloatPaise = dayOps?.openingFloat || 500000;
  const expectedDrawerCashPaise = Math.max(
    0,
    openingFloatPaise + cashSalesPaise + totalCashInPaise - totalCashOutPaise
  );

  // Handle Open Day
  const handleOpenDaySubmit = async (e) => {
    e.preventDefault();
    const floatPaise = Math.round((parseFloat(openingFloatRupees) || 0) * 100);

    try {
      await apiClient.post('/v1/day-ops/open', {
        openingFloat: floatPaise,
        notes: openNotes,
      });
    } catch (_err) {
      // Offline fallback
    }

    openDay(floatPaise);
    onNotify(`Business Day Opened with opening float of ₹${openingFloatRupees}!`);
  };

  // Handle Close Day
  const handleCloseDaySubmit = async (e) => {
    e.preventDefault();
    const countedPaise = Math.round((parseFloat(countedCashRupees) || 0) * 100);

    try {
      await apiClient.post('/v1/day-ops/close', {
        closingNotes: closeNotes,
        countedCash: countedPaise,
      });
    } catch (_err) {
      // Offline fallback
    }

    closeDay();
    setIsCloseModalOpen(false);
    onNotify('Business Day successfully closed & settlement finalized!');
  };

  // Handle Record Movement
  const handleRecordMovement = async (e) => {
    e.preventDefault();
    if (!movAmountRupees || !movReason.trim()) return;

    const amountPaise = Math.round((parseFloat(movAmountRupees) || 0) * 100);

    try {
      await apiClient.post('/v1/day-ops/cash-movements', {
        type: movType,
        amount: amountPaise,
        reason: movReason.trim(),
      });
    } catch (_err) {
      // Offline fallback
    }

    recordCashMovement({
      type: movType,
      amountPaise,
      reason: movReason.trim(),
    });

    onNotify(`Cash movement "${movType}" recorded (₹${movAmountRupees})`);
    setIsMovModalOpen(false);
    setMovAmountRupees('');
    setMovReason('');
  };

  return (
    <div className="space-y-6">
      {/* Day Status Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
          isDayOpen
            ? 'bg-emerald-50/60 border-emerald-200'
            : 'bg-amber-50/60 border-amber-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isDayOpen
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            {isDayOpen ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Business Day Status:{' '}
                <span className={isDayOpen ? 'text-emerald-700' : 'text-amber-800'}>
                  {isDayOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </h2>
              <Badge
                className={`text-[10px] font-bold uppercase ${
                  isDayOpen ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                }`}
              >
                {isDayOpen ? 'Active Operations' : 'Register Locked'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isDayOpen
                ? `Opened at ${dayOps?.openedAt ? new Date(dayOps.openedAt).toLocaleTimeString() : 'Shift Start'} with opening cash float ${formatPaiseToRupees(openingFloatPaise)}`
                : 'Day is closed. Enter opening cash float to begin order taking and billing.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDayOpen ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsMovModalOpen(true)}
                className="h-9 px-3 text-xs border-slate-300 hover:bg-slate-100 font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Record Cash In / Out
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCloseModalOpen(true)}
                className="h-9 px-4 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                Close Business Day
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                const el = document.getElementById('open-day-form');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
            >
              <Unlock className="w-3.5 h-3.5 mr-1.5" />
              Open New Day
            </Button>
          )}
        </div>
      </div>

      {/* If Day is Closed: Prompt to Open */}
      {!isDayOpen && (
        <Card id="open-day-form" className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Unlock className="w-4 h-4 text-emerald-600" />
              Start New Business Day & Float Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleOpenDaySubmit} className="max-w-md space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Opening Cash Float in Register Drawer (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                    ₹
                  </span>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={openingFloatRupees}
                    onChange={(e) => setOpeningFloatRupees(e.target.value)}
                    className="pl-7 text-xs h-9 font-bold font-mono"
                    placeholder="5000"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Physical currency kept in cash drawer for providing customer change
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Opening Remarks</label>
                <Input
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  placeholder="e.g. Standard morning float verified by manager"
                  className="text-xs h-9"
                />
              </div>

              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 shadow-xs"
              >
                <Unlock className="w-3.5 h-3.5 mr-1.5" />
                Open Business Day
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Live Register Drawer Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="border-slate-200 shadow-xs bg-white p-3.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Opening Float</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {formatPaiseToRupees(openingFloatPaise)}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Base register change</p>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white p-3.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[10px] font-bold uppercase text-emerald-600">Cash Sales</span>
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-700">
            {formatPaiseToRupees(cashSalesPaise)}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Counter bills settled</p>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white p-3.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[10px] font-bold uppercase text-sky-600">Cash In (Float Add)</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-lg font-black text-sky-700">
            {formatPaiseToRupees(totalCashInPaise)}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Emergency change added</p>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white p-3.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[10px] font-bold uppercase text-rose-600">Cash Out / Drops</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-black text-rose-700">
            {formatPaiseToRupees(totalCashOutPaise)}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Petty expenses & bank drops</p>
        </Card>

        <Card className="border-indigo-200 shadow-xs bg-indigo-50/50 p-3.5 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[10px] font-bold uppercase text-indigo-700">Expected Drawer</span>
            <DollarSign className="w-3.5 h-3.5 text-indigo-700" />
          </div>
          <div className="text-xl font-black text-indigo-900">
            {formatPaiseToRupees(expectedDrawerCashPaise)}
          </div>
          <p className="text-[10px] text-indigo-600 mt-0.5">Live counted balance</p>
        </Card>
      </div>

      {/* Cash Movement Ledger */}
      <Card className="border-slate-200 shadow-xs overflow-hidden bg-white">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Drawer Cash Movements Log ({movements.length})
            </CardTitle>
            <p className="text-[11px] text-slate-500">
              Petty cash disbursements, change refills, and safe drops recorded today
            </p>
          </div>
          {isDayOpen && (
            <Button
              size="sm"
              onClick={() => setIsMovModalOpen(true)}
              className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white font-semibold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Record Movement
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {movements.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <CalendarDays className="w-7 h-7 mx-auto mb-1 stroke-1" />
              <p className="text-xs">No drawer cash movements recorded yet for this shift.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                    <th className="py-2.5 px-4">Time</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Reason / Notes</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                        {m.timestamp || 'Just now'}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            m.type === 'CASH_IN'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : m.type === 'CASH_DROP'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {m.type === 'CASH_IN' ? '+ CASH IN' : m.type === 'CASH_DROP' ? 'SAFE DROP' : '- CASH OUT'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{m.reason}</td>
                      <td
                        className={`py-2.5 px-4 text-right font-mono font-bold ${
                          m.type === 'CASH_IN' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {m.type === 'CASH_IN' ? '+' : '-'} {formatPaiseToRupees(m.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL: RECORD CASH MOVEMENT */}
      {isMovModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-sm bg-white border-slate-200 shadow-2xl animate-in zoom-in-95">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">Record Drawer Cash Movement</CardTitle>
            </CardHeader>

            <form onSubmit={handleRecordMovement} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Movement Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovType('CASH_OUT')}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      movType === 'CASH_OUT'
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Cash Out (Petty)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovType('CASH_IN')}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      movType === 'CASH_IN'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Cash In (Float)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovType('CASH_DROP')}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      movType === 'CASH_DROP'
                        ? 'bg-purple-50 border-purple-300 text-purple-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Safe Drop
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Amount (₹) *</label>
                <Input
                  required
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 500"
                  value={movAmountRupees}
                  onChange={(e) => setMovAmountRupees(e.target.value)}
                  className="text-xs h-9 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reason / Description *
                </label>
                <Input
                  required
                  placeholder="e.g. Milk & curd supply payment"
                  value={movReason}
                  onChange={(e) => setMovReason(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMovModalOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  Record Entry
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: CLOSE BUSINESS DAY */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-sm bg-white border-slate-200 shadow-2xl animate-in zoom-in-95">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                Close Business Day Settlement
              </CardTitle>
            </CardHeader>

            <form onSubmit={handleCloseDaySubmit} className="p-4 space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>System Expected Cash:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {formatPaiseToRupees(expectedDrawerCashPaise)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Actual Counted Cash in Drawer (₹) *
                </label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 15450"
                  value={countedCashRupees}
                  onChange={(e) => setCountedCashRupees(e.target.value)}
                  className="text-xs h-9 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Closing Remarks</label>
                <Input
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="e.g. All shifts settled, cash transferred to safe"
                  className="text-xs h-9"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Confirm & Close Day
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ManagerDayOpsTab;
