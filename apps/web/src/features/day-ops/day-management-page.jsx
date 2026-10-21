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
  IndianRupee,
} from 'lucide-react';
import { formatPaiseToRupees, DAY_STATUS } from '@pos/shared';

export function DayManagementPage() {
  const [dayStatus, setDayStatus] = useState(DAY_STATUS.OPEN);
  const [openingFloat, setOpeningFloat] = useState(500000); // 5000 in paise
  const [cashSales] = useState(2450000); // 24,500
  const [cashIn, setCashIn] = useState(200000); // 2,000
  const [cashOut, setCashOut] = useState(150000); // 1,500
  const [cashDrop, setCashDrop] = useState(1000000); // 10,000
  const [closingCounted, setClosingCounted] = useState(2000000);

  // Modals
  const [isCashMovementOpen, setIsCashMovementOpen] = useState(false);
  const [movementType, setMovementType] = useState('CASH_OUT');
  const [movementAmount, setMovementAmount] = useState(500);
  const [movementReason, setMovementReason] = useState('Purchased fresh mint leaves & lemons');

  const [isCloseDayOpen, setIsCloseDayOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const expectedCash = openingFloat + cashSales + cashIn - cashOut - cashDrop;
  const variance = closingCounted - expectedCash;

  const handleRecordMovement = () => {
    const amtPaise = Number(movementAmount) * 100;
    if (movementType === 'CASH_IN') setCashIn((prev) => prev + amtPaise);
    if (movementType === 'CASH_OUT') setCashOut((prev) => prev + amtPaise);
    if (movementType === 'CASH_DROP') setCashDrop((prev) => prev + amtPaise);

    setIsCashMovementOpen(false);
    setNotification(`Recorded ${movementType.replace('_', ' ')} of ₹${movementAmount}!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCloseDay = () => {
    setDayStatus(DAY_STATUS.CLOSED);
    setIsCloseDayOpen(false);
    setNotification('Business day closed and cash reconciliation saved!');
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-400" />
            Day Operations & Cash Drawer
          </h1>
          <p className="text-sm text-slate-400">
            Business day lifecycle, shift tracking, petty expenses, and drawer reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dayStatus === DAY_STATUS.OPEN ? (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 px-3 py-1 text-xs">
              Day Open (Active)
            </Badge>
          ) : (
            <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/40 px-3 py-1 text-xs">
              Day Closed
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            className="border-slate-800 gap-1.5"
            onClick={() => setIsCashMovementOpen(true)}
          >
            <Banknote className="w-4 h-4 text-emerald-400" />
            Cash In / Out / Drop
          </Button>
          {dayStatus === DAY_STATUS.OPEN ? (
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={() => setIsCloseDayOpen(true)}
            >
              Close Business Day
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 gap-1.5"
              onClick={() => setDayStatus(DAY_STATUS.OPEN)}
            >
              Open New Day
            </Button>
          )}
        </div>
      </div>

      {/* Cash Reconciliation Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-400 flex items-center justify-between">
              <span>Opening Float</span>
              <Calendar className="w-4 h-4 text-slate-500" />
            </p>
            <p className="text-2xl font-bold text-white flex items-center">
              <IndianRupee className="w-5 h-5 text-slate-400" />
              {formatPaiseToRupees(openingFloat)}
            </p>
            <p className="text-[11px] text-slate-500">Drawer starting amount</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-400 flex items-center justify-between">
              <span>Today's Cash Sales</span>
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
            </p>
            <p className="text-2xl font-bold text-emerald-400 flex items-center">
              <IndianRupee className="w-5 h-5 text-emerald-500" />
              {formatPaiseToRupees(cashSales)}
            </p>
            <p className="text-[11px] text-slate-500">Collected from invoices</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-400 flex items-center justify-between">
              <span>Petty Out & Drops</span>
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
            </p>
            <p className="text-2xl font-bold text-rose-400 flex items-center">
              <IndianRupee className="w-5 h-5 text-rose-500" />
              {formatPaiseToRupees(cashOut + cashDrop)}
            </p>
            <p className="text-[11px] text-slate-500">Expenses & Safe transfers</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-emerald-500/40">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-400 flex items-center justify-between">
              <span>Expected Cash in Drawer</span>
              <Vault className="w-4 h-4 text-emerald-400" />
            </p>
            <p className="text-2xl font-bold text-white flex items-center">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
              {formatPaiseToRupees(expectedCash)}
            </p>
            <p className="text-[11px] text-slate-500">Opening + Sales + In - Out</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Movement Modal */}
      {isCashMovementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Record Cash Movement</h3>
                <button onClick={() => setIsCashMovementOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
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
                      movementType === type.id ? 'bg-emerald-600' : 'border-slate-800'
                    }`}
                    onClick={() => setMovementType(type.id)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Amount (₹):</label>
                <Input
                  type="number"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="bg-slate-950 border-slate-800 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Reason / Expense Category:</label>
                <Input
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="bg-slate-950 border-slate-800 mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="ghost" onClick={() => setIsCashMovementOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={handleRecordMovement}>
                  Record Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Close Day Reconciliation Modal */}
      {isCloseDayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Vault className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">End of Day Reconciliation</h3>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>System Expected Cash:</span>
                  <span className="font-bold text-white">₹{formatPaiseToRupees(expectedCash)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Actual Physically Counted Cash (₹):</label>
                <Input
                  type="number"
                  value={closingCounted / 100}
                  onChange={(e) => setClosingCounted(Math.round(Number(e.target.value) * 100))}
                  className="bg-slate-950 border-slate-800 text-lg font-bold text-white mt-1"
                />
              </div>

              {/* Variance Indicator */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                  variance === 0
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : variance < 0
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                    : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                }`}
              >
                <span>Reconciliation Variance:</span>
                <span className="font-bold text-sm">
                  {variance === 0 ? 'Balanced (₹0)' : `₹${formatPaiseToRupees(variance)}`}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="ghost" onClick={() => setIsCloseDayOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-rose-600 hover:bg-rose-500" onClick={handleCloseDay}>
                  Confirm & Close Day
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}
    </div>
  );
}
