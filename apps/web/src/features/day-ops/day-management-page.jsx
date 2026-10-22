import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Vault,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  X,
  CreditCard,
  QrCode,
  Receipt,
} from 'lucide-react';
import { formatPaiseToRupees, DAY_STATUS } from '@pos/shared';
import { usePosStore } from '@/stores/pos-store';

export function DayManagementPage() {
  const { dayOps, invoices, recordCashMovement, closeDay, openDay } = usePosStore();

  const [isCashMovementOpen, setIsCashMovementOpen] = useState(false);
  const [movementType, setMovementType] = useState('CASH_OUT');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');

  const [isCloseDayOpen, setIsCloseDayOpen] = useState(false);
  const [closingCounted, setClosingCounted] = useState(0);
  const [notification, setNotification] = useState(null);

  // Compute real dynamic cash sales from settled invoices
  const allInvoices = Object.values(invoices);
  const cashSales = allInvoices
    .filter((inv) => inv.paymentMode === 'CASH')
    .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const upiSales = allInvoices
    .filter((inv) => inv.paymentMode === 'UPI')
    .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const cardSales = allInvoices
    .filter((inv) => inv.paymentMode === 'CARD')
    .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const totalSales = cashSales + upiSales + cardSales;

  // Real cash movements calculation
  const movements = dayOps.movements || [];
  const cashIn = movements
    .filter((m) => m.type === 'CASH_IN')
    .reduce((sum, m) => sum + m.amount, 0);

  const cashOut = movements
    .filter((m) => m.type === 'CASH_OUT')
    .reduce((sum, m) => sum + m.amount, 0);

  const cashDrop = movements
    .filter((m) => m.type === 'CASH_DROP')
    .reduce((sum, m) => sum + m.amount, 0);

  const openingFloat = dayOps.openingFloat || 500000;
  const expectedCash = openingFloat + cashSales + cashIn - cashOut - cashDrop;
  const variance = closingCounted - expectedCash;

  const handleRecordMovement = () => {
    if (!movementAmount || Number(movementAmount) <= 0) return;
    const amtPaise = Math.round(Number(movementAmount) * 100);

    recordCashMovement({
      type: movementType,
      amountPaise: amtPaise,
      reason: movementReason || (movementType === 'CASH_OUT' ? 'Petty expense' : 'Cash adjustment'),
    });

    setIsCashMovementOpen(false);
    setMovementAmount('');
    setMovementReason('');
    setNotification(`Recorded ${movementType.replace('_', ' ')} of ₹${movementAmount}!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCloseDay = () => {
    closeDay();
    setIsCloseDayOpen(false);
    setNotification('Business day closed and cash reconciliation saved!');
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenDay = () => {
    openDay(500000);
    setNotification('New business day opened with ₹5,000 opening float!');
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-700" />
            Day Operations & Cash Drawer
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Live business day summary, shift tracking, petty expenses, and drawer reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dayOps.status === 'OPEN' ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
              Day Open (Active)
            </Badge>
          ) : (
            <Badge className="bg-rose-50 text-rose-700 border-rose-200 px-2.5 py-0.5 text-xs font-semibold">
              Day Closed
            </Badge>
          )}

          <Button
            size="sm"
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 h-8 text-xs font-semibold"
            onClick={() => setIsCashMovementOpen(true)}
            disabled={dayOps.status !== 'OPEN'}
          >
            <Banknote className="w-3.5 h-3.5 text-slate-600" />
            Cash In / Out / Drop
          </Button>

          {dayOps.status === 'OPEN' ? (
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5 h-8 text-xs font-semibold"
              onClick={() => {
                setClosingCounted(expectedCash);
                setIsCloseDayOpen(true);
              }}
            >
              Close Business Day
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 h-8 text-xs font-semibold"
              onClick={handleOpenDay}
            >
              Open New Day
            </Button>
          )}
        </div>
      </div>

      {/* Cash Reconciliation Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Opening Float</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </p>
          <p className="text-xl font-bold text-slate-900">
            {formatPaiseToRupees(openingFloat)}
          </p>
          <p className="text-[11px] text-slate-500">Drawer starting cash balance</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Today's Cash Sales</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
          </p>
          <p className="text-xl font-bold text-emerald-700">
            {formatPaiseToRupees(cashSales)}
          </p>
          <p className="text-[11px] text-slate-500">From real settled cash invoices</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Petty Out & Drops</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </p>
          <p className="text-xl font-bold text-rose-700">
            {formatPaiseToRupees(cashOut + cashDrop)}
          </p>
          <p className="text-[11px] text-slate-500">Expenses & safe drops recorded</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Expected in Drawer</span>
            <Vault className="w-4 h-4 text-slate-600" />
          </p>
          <p className="text-xl font-bold text-slate-900">
            {formatPaiseToRupees(expectedCash)}
          </p>
          <p className="text-[11px] text-slate-500">Float + Cash Sales + In - Out</p>
        </div>
      </div>

      {/* Multi-Payment Mode Sales Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Cash Collected</p>
              <p className="text-base font-bold text-slate-900">{formatPaiseToRupees(cashSales)}</p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {allInvoices.filter((i) => i.paymentMode === 'CASH').length} Bills
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-50 text-sky-700">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">UPI & QR Collected</p>
              <p className="text-base font-bold text-slate-900">{formatPaiseToRupees(upiSales)}</p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {allInvoices.filter((i) => i.paymentMode === 'UPI').length} Bills
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Card Payments</p>
              <p className="text-base font-bold text-slate-900">{formatPaiseToRupees(cardSales)}</p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {allInvoices.filter((i) => i.paymentMode === 'CARD').length} Bills
          </span>
        </div>
      </div>

      {/* Cash Movements Ledger */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recorded Cash Drawer Movements</h2>
          <span className="text-xs text-slate-500 font-medium">{movements.length} entries</span>
        </div>

        {movements.length === 0 ? (
          <div className="p-8 text-center">
            <Vault className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No cash movements recorded yet today.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold">
                <tr>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Reason / Notes</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono text-slate-600">{m.timestamp}</td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`text-[10px] font-semibold ${
                          m.type === 'CASH_IN'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : m.type === 'CASH_OUT'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {m.type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{m.reason}</td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        m.type === 'CASH_IN' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {m.type === 'CASH_IN' ? '+' : '-'}
                      {formatPaiseToRupees(m.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cash Movement Modal */}
      {isCashMovementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Record Cash Movement</h3>
                <button onClick={() => setIsCashMovementOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CASH_OUT', label: 'Petty Expense' },
                  { id: 'CASH_IN', label: 'Float In' },
                  { id: 'CASH_DROP', label: 'Safe Drop' },
                ].map((type) => (
                  <Button
                    key={type.id}
                    type="button"
                    variant={movementType === type.id ? 'default' : 'outline'}
                    className={`text-xs ${
                      movementType === type.id ? 'bg-slate-900 text-white' : 'border-slate-200 text-slate-700'
                    }`}
                    onClick={() => setMovementType(type.id)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Amount (₹):</label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="bg-slate-50 border-slate-200 mt-1 h-9 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Reason / Expense Category:</label>
                <Input
                  placeholder="e.g. Purchased lemons & mint leaves"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="bg-slate-50 border-slate-200 mt-1 h-9 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" className="text-xs text-slate-600" onClick={() => setIsCashMovementOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold" onClick={handleRecordMovement}>
                  Record Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Close Day Reconciliation Modal */}
      {isCloseDayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Vault className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">End of Day Reconciliation</h3>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>System Expected Cash:</span>
                  <span className="font-bold text-slate-900">{formatPaiseToRupees(expectedCash)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Actual Physically Counted Cash (₹):</label>
                <Input
                  type="number"
                  value={closingCounted / 100}
                  onChange={(e) => setClosingCounted(Math.round(Number(e.target.value) * 100))}
                  className="bg-slate-50 border-slate-200 text-base font-bold text-slate-900 mt-1 h-9"
                />
              </div>

              {/* Variance Indicator */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between text-xs font-semibold ${
                  variance === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : variance < 0
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <span>Reconciliation Variance:</span>
                <span className="font-bold text-sm">
                  {variance === 0 ? 'Balanced (₹0)' : formatPaiseToRupees(variance)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" className="text-xs text-slate-600" onClick={() => setIsCloseDayOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold" onClick={handleCloseDay}>
                  Confirm & Close Day
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
