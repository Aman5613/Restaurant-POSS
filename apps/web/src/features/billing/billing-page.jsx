import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Receipt,
  IndianRupee,
  CreditCard,
  QrCode,
  Banknote,
  Clock,
  Split,
  Percent,
  Ban,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
} from 'lucide-react';
import { formatPaiseToRupees } from '@pos/shared';

export function BillingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || 'ord_1';

  const [paymentMode, setPaymentMode] = useState('CASH'); // CASH, UPI, CARD, DUE
  const [cashTendered, setCashTendered] = useState(100000); // 1000 rupees in paise
  const [cardRef, setCardRef] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Modals state
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [discountType, setDiscountType] = useState('PERCENT'); // PERCENT or FLAT
  const [discountValue, setDiscountValue] = useState(10);
  const [discountReason, setDiscountReason] = useState('Happy Hours Promo');

  const [isSplitOpen, setIsSplitOpen] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('Order cancelled by customer before eating');
  const [managerPin, setManagerPin] = useState('');

  const [settledSuccess, setSettledSuccess] = useState(null);

  // Sample bill data
  const [bill, setBill] = useState({
    id: 'bil_001',
    billNo: 'BIL-0042',
    orderNo: 'ORD-0041',
    tableName: 'Table 1',
    guestCount: 3,
    cashierName: 'Counter Cashier',
    lines: [
      { id: '1', name: 'Paneer Tikka (Full)', quantity: 1, unitPrice: 28000, gross: 28000 },
      { id: '2', name: 'Butter Chicken (Full)', quantity: 1, unitPrice: 39000, gross: 39000 },
      { id: '3', name: 'Butter Naan', quantity: 4, unitPrice: 6500, gross: 26000 },
      { id: '4', name: 'Masala Chaas', quantity: 2, unitPrice: 7000, gross: 14000 },
    ],
    discount: null, // { type: 'PERCENT', value: 10, amount: 10700 }
  });

  // Calculate bill totals
  const subtotal = bill.lines.reduce((sum, l) => sum + l.gross, 0);
  let discountAmount = 0;
  if (bill.discount) {
    if (bill.discount.type === 'PERCENT') {
      discountAmount = Math.round((subtotal * bill.discount.value) / 100);
    } else {
      discountAmount = bill.discount.value;
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const cgstAmount = Math.round((taxableAmount * 2.5) / 100);
  const sgstAmount = Math.round((taxableAmount * 2.5) / 100);
  const rawTotal = taxableAmount + cgstAmount + sgstAmount;
  const roundOff = Math.round(rawTotal / 100) * 100 - rawTotal;
  const grandTotal = rawTotal + roundOff;

  const changeReturned = Math.max(0, cashTendered - grandTotal);

  const handleApplyDiscount = () => {
    setBill((prev) => ({
      ...prev,
      discount: {
        type: discountType,
        value: discountType === 'PERCENT' ? Number(discountValue) : Number(discountValue) * 100,
        reason: discountReason,
      },
    }));
    setIsDiscountOpen(false);
  };

  const handleSettle = () => {
    const invoiceNo = `INV-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
    setSettledSuccess({
      invoiceNo,
      grandTotal,
      paymentMode,
      changeReturned,
    });
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* LEFT PANEL: Bill Preview & Calculations */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              Provisional Bill Preview
            </h1>
            <p className="text-xs text-slate-400">
              {bill.billNo} • {bill.tableName} • {bill.guestCount} Guests
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 gap-1.5 border-slate-800"
              onClick={() => setIsDiscountOpen(true)}
            >
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              {bill.discount ? 'Edit Discount' : 'Discount'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 gap-1.5 border-slate-800"
              onClick={() => setIsSplitOpen(true)}
            >
              <Split className="w-3.5 h-3.5 text-blue-400" />
              Split
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="text-xs h-8 gap-1.5"
              onClick={() => setIsVoidOpen(true)}
            >
              <Ban className="w-3.5 h-3.5" />
              Void
            </Button>
          </div>
        </div>

        {/* Lines Table */}
        <div className="flex-1 overflow-y-auto py-3">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 uppercase text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-right">Gross Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {bill.lines.map((line) => (
                <tr key={line.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-semibold text-white">{line.name}</td>
                  <td className="py-3 px-3 text-center">{line.quantity}</td>
                  <td className="py-3 px-3 text-right">₹{formatPaiseToRupees(line.unitPrice)}</td>
                  <td className="py-3 px-3 text-right font-bold text-white">
                    ₹{formatPaiseToRupees(line.gross)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Breakdown Calculation */}
        <div className="border-t border-slate-800 pt-3 space-y-1.5 bg-slate-950/40 p-3 rounded-lg">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Item Subtotal</span>
            <span>₹{formatPaiseToRupees(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-amber-400 font-medium">
              <span>
                Discount ({bill.discount.type === 'PERCENT' ? `${bill.discount.value}%` : 'Flat'} - {bill.discount.reason})
              </span>
              <span>-₹{formatPaiseToRupees(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs text-slate-400">
            <span>Taxable Amount</span>
            <span>₹{formatPaiseToRupees(taxableAmount)}</span>
          </div>

          <div className="flex justify-between text-xs text-slate-400">
            <span>CGST (2.5%)</span>
            <span>₹{formatPaiseToRupees(cgstAmount)}</span>
          </div>

          <div className="flex justify-between text-xs text-slate-400">
            <span>SGST (2.5%)</span>
            <span>₹{formatPaiseToRupees(sgstAmount)}</span>
          </div>

          {roundOff !== 0 && (
            <div className="flex justify-between text-xs text-slate-400">
              <span>Round Off</span>
              <span>₹{formatPaiseToRupees(roundOff)}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
            <span>Net Payable Total</span>
            <span className="text-emerald-400 text-lg">₹{formatPaiseToRupees(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Payment Tender Panel */}
      <div className="w-full lg:w-[460px] flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden">
        <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800 flex items-center justify-between">
          <span>Payment & Settlement</span>
          <span className="text-emerald-400 text-lg">₹{formatPaiseToRupees(grandTotal)}</span>
        </h2>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-4 gap-1.5 py-3 border-b border-slate-800">
          <button
            onClick={() => setPaymentMode('CASH')}
            className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${
              paymentMode === 'CASH'
                ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Banknote className="w-4 h-4 text-emerald-400" />
            <span className="text-xs">Cash</span>
          </button>

          <button
            onClick={() => setPaymentMode('UPI')}
            className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${
              paymentMode === 'UPI'
                ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            <span className="text-xs">UPI QR</span>
          </button>

          <button
            onClick={() => setPaymentMode('CARD')}
            className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${
              paymentMode === 'CARD'
                ? 'bg-purple-600/20 border-purple-500 text-white font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span className="text-xs">Card</span>
          </button>

          <button
            onClick={() => setPaymentMode('DUE')}
            className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${
              paymentMode === 'DUE'
                ? 'bg-amber-600/20 border-amber-500 text-white font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs">Due/Credit</span>
          </button>
        </div>

        {/* Dynamic Mode Forms */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {paymentMode === 'CASH' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">Cash Tendered by Customer (₹)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-bold">₹</span>
                  <Input
                    type="number"
                    value={cashTendered / 100}
                    onChange={(e) => setCashTendered(Math.round(Number(e.target.value) * 100))}
                    className="pl-8 text-lg font-bold bg-slate-950 border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Currency Presets */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Exact', val: grandTotal },
                  { label: '₹100', val: 10000 },
                  { label: '₹200', val: 20000 },
                  { label: '₹500', val: 50000 },
                  { label: '₹1,000', val: 100000 },
                  { label: '₹2,000', val: 200000 },
                ].map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-800 hover:border-emerald-500 text-xs font-semibold"
                    onClick={() => setCashTendered(preset.val)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Change Return Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Change to Return</p>
                  <p
                    className={`text-xl font-bold ${
                      cashTendered < grandTotal ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    ₹{formatPaiseToRupees(changeReturned)}
                  </p>
                </div>
                {cashTendered < grandTotal && (
                  <span className="text-xs text-rose-400 font-semibold">Short by ₹{formatPaiseToRupees(grandTotal - cashTendered)}</span>
                )}
              </div>
            </div>
          )}

          {paymentMode === 'UPI' && (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="p-3 bg-white rounded-xl shadow-lg">
                <QrCode className="w-36 h-36 text-slate-900" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-300">Scan via GPay / PhonePe / Paytm</p>
                <p className="text-lg font-bold text-emerald-400">₹{formatPaiseToRupees(grandTotal)}</p>
                <p className="text-[11px] text-slate-500 font-mono">VPA: restaurant@icici</p>
              </div>
            </div>
          )}

          {paymentMode === 'CARD' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400">Card Swiped Amount</label>
                <Input
                  disabled
                  value={`₹${formatPaiseToRupees(grandTotal)}`}
                  className="bg-slate-950 border-slate-800 font-bold text-white text-base mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400">EDC Terminal RRN / Auth Code</label>
                <Input
                  placeholder="Enter swipe transaction ID..."
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-sm mt-1"
                />
              </div>
            </div>
          )}

          {paymentMode === 'DUE' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400">Customer Phone Number</label>
                <Input
                  placeholder="10-digit mobile number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400">Customer Name / Company</label>
                <Input
                  placeholder="Full Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-sm mt-1"
                />
              </div>
              <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Amount will be logged in customer credit ledger for future settlement.</span>
              </div>
            </div>
          )}
        </div>

        {/* Settlement CTA Button */}
        <div className="border-t border-slate-800 pt-3">
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-500 h-12 text-base font-bold gap-2"
            disabled={paymentMode === 'CASH' && cashTendered < grandTotal}
            onClick={handleSettle}
          >
            <CheckCircle2 className="w-5 h-5" />
            Settle Bill & Issue Invoice
          </Button>
        </div>
      </div>

      {/* Discount Modal */}
      {isDiscountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Percent className="w-5 h-5 text-amber-400" />
                  Apply Bill Discount
                </h3>
                <button onClick={() => setIsDiscountOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={discountType === 'PERCENT' ? 'default' : 'outline'}
                  className={discountType === 'PERCENT' ? 'bg-amber-600' : 'border-slate-800'}
                  onClick={() => setDiscountType('PERCENT')}
                >
                  Percentage (%)
                </Button>
                <Button
                  type="button"
                  variant={discountType === 'FLAT' ? 'default' : 'outline'}
                  className={discountType === 'FLAT' ? 'bg-amber-600' : 'border-slate-800'}
                  onClick={() => setDiscountType('FLAT')}
                >
                  Flat Amount (₹)
                </Button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">
                  {discountType === 'PERCENT' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                </label>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="bg-slate-950 border-slate-800 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Discount Reason</label>
                <Input
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="e.g. Regular Guest, Management Courtesy"
                  className="bg-slate-950 border-slate-800 mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="ghost" onClick={() => setIsDiscountOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-amber-600 hover:bg-amber-500" onClick={handleApplyDiscount}>
                  Apply Discount
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Split Bill Modal */}
      {isSplitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Split className="w-5 h-5 text-blue-400" />
                  Split Bill
                </h3>
                <button onClick={() => setIsSplitOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Split Equally Among People:</label>
                <div className="flex items-center gap-2 mt-2">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={splitCount === num ? 'default' : 'outline'}
                      className={splitCount === num ? 'bg-blue-600' : 'border-slate-800'}
                      onClick={() => setSplitCount(num)}
                    >
                      {num} Ways
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                <p className="text-xs text-slate-400">Each Person Pays:</p>
                <p className="text-xl font-bold text-blue-400">
                  ₹{formatPaiseToRupees(Math.round(grandTotal / splitCount))}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="ghost" onClick={() => setIsSplitOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-500"
                  onClick={() => {
                    setIsSplitOpen(false);
                  }}
                >
                  Generate Split Invoices
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Void Bill Modal */}
      {isVoidOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-500" />
                <h3 className="text-lg font-bold text-white">Void Bill (Manager Approval)</h3>
              </div>
              <p className="text-xs text-slate-400">
                Voiding a bill requires manager override PIN and logs an irreversible audit entry.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-300">Reason for Voiding:</label>
                <Input
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Manager Security PIN:</label>
                <Input
                  type="password"
                  maxLength={4}
                  placeholder="Enter 4-digit PIN (1234)"
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-sm mt-1 tracking-widest text-center"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="ghost" onClick={() => setIsVoidOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsVoidOpen(false);
                    navigate('/tables');
                  }}
                >
                  Confirm Void
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settlement Success Dialog */}
      {settledSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Bill Settled Successfully!</h3>
                <p className="text-xs text-slate-400 mt-1">Invoice #{settledSuccess.invoiceNo} issued</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Settled Amount</span>
                  <span className="font-bold text-white">₹{formatPaiseToRupees(settledSuccess.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Payment Mode</span>
                  <span className="font-bold text-white">{settledSuccess.paymentMode}</span>
                </div>
                {settledSuccess.changeReturned > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Change Returned</span>
                    <span>₹{formatPaiseToRupees(settledSuccess.changeReturned)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-800 gap-1.5"
                  onClick={() => navigate(`/invoices/preview?no=${settledSuccess.invoiceNo}`)}
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  Print Receipt
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-semibold"
                  onClick={() => navigate('/tables')}
                >
                  Next Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
