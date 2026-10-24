import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Receipt,
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
  ArrowLeft,
} from 'lucide-react';
import { formatPaiseToRupees } from '@pos/shared';
import { usePosStore } from '@/stores/pos-store';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';

export function BillingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('tableId') || 'tbl_1';
  const paramTableName = searchParams.get('tableName');

  const { getTableOrder, settleBillAndFreeTable, tables, outlet, setOutlet } = usePosStore();

  const [paymentModesList, setPaymentModesList] = useState([]);
  const [taxGroup, setTaxGroup] = useState(null);
  const [chargeList, setChargeList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      apiClient.get('/v1/outlet/profile').catch(() => null),
      apiClient.get('/v1/outlet/payment-modes').catch(() => null),
      apiClient.get('/v1/outlet/tax-groups').catch(() => null),
      apiClient.get('/v1/outlet/charges').catch(() => null),
    ]).then(([profileRes, modesRes, taxesRes, chargesRes]) => {
      if (!isMounted) return;
      const o = profileRes?.data?.outlet || profileRes?.data;
      if (o) setOutlet(o);

      const rawModes = Array.isArray(modesRes?.data?.paymentModes)
        ? modesRes.data.paymentModes
        : Array.isArray(modesRes?.data)
        ? modesRes.data
        : [];
      if (rawModes.length > 0) {
        setPaymentModesList(rawModes);
        const enabled = rawModes.filter((m) => m.isEnabled !== false);
        if (enabled.length > 0 && !enabled.some((m) => m.code === paymentMode)) {
          setPaymentMode(enabled[0].code);
        }
      }

      const rawTaxes = Array.isArray(taxesRes?.data?.taxes)
        ? taxesRes.data.taxes
        : Array.isArray(taxesRes?.data)
        ? taxesRes.data
        : [];
      if (rawTaxes.length > 0) {
        const selectedTax = rawTaxes.find((t) => t.rate === 5) || rawTaxes[0];
        setTaxGroup(selectedTax);
      }

      const rawCharges = Array.isArray(chargesRes?.data?.charges)
        ? chargesRes.data.charges
        : Array.isArray(chargesRes?.data)
        ? chargesRes.data
        : [];
      setChargeList(rawCharges);
    });

    return () => {
      isMounted = false;
    };
  }, [setOutlet]);

  const currentTable = tables.find((t) => t.id === tableId);
  const activeOrder = getTableOrder(tableId);

  const tableName = paramTableName || activeOrder?.tableName || currentTable?.name || 'Counter';
  const billLines = useMemo(() => {
    if (activeOrder && activeOrder.lines?.length) {
      return activeOrder.lines.filter((l) => l.status !== 'CANCELLED');
    }
    return [];
  }, [activeOrder]);

  const paramCustomerName = searchParams.get('customerName');
  const paramCustomerPhone = searchParams.get('customerPhone');

  const [paymentMode, setPaymentMode] = useState('CASH'); // CASH, UPI, CARD, DUE
  const [cardRef, setCardRef] = useState('');
  const [customerPhone, setCustomerPhone] = useState(paramCustomerPhone || activeOrder?.customerPhone || '');
  const [customerName, setCustomerName] = useState(paramCustomerName || activeOrder?.customerName || '');

  // Modals state
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [discountType, setDiscountType] = useState('PERCENT'); // PERCENT or FLAT
  const [discountValue, setDiscountValue] = useState(10);
  const [discountReason, setDiscountReason] = useState('Happy Hours Promo');
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  const [isSplitOpen, setIsSplitOpen] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('Order cancelled by customer before eating');
  const [managerPin, setManagerPin] = useState('');

  const [settledSuccess, setSettledSuccess] = useState(null);

  // Calculate bill totals from real lines
  const subtotal = billLines.reduce((sum, l) => {
    const addons = (l.addons || []).reduce((acc, a) => acc + (a.price || 0), 0);
    return sum + (l.unitPrice + addons) * l.quantity;
  }, 0);

  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === 'PERCENT') {
      discountAmount = Math.round((subtotal * appliedDiscount.value) / 100);
    } else {
      discountAmount = appliedDiscount.value;
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // Dynamic GST calculation from configured Tax Group
  const taxRate = taxGroup ? Number(taxGroup.rate) : 5;
  const cgstRate = taxGroup?.cgstRate !== undefined ? Number(taxGroup.cgstRate) : taxRate / 2;
  const sgstRate = taxGroup?.sgstRate !== undefined ? Number(taxGroup.sgstRate) : taxRate / 2;
  const cgstAmount = Math.round((taxableAmount * cgstRate) / 100);
  const sgstAmount = Math.round((taxableAmount * sgstRate) / 100);

  // Dynamic applicable charges (Service Charge, Packaging Fee)
  const currentOrderType = activeOrder?.orderType || 'DINE_IN';
  const applicableCharges = useMemo(() => {
    return (chargeList || [])
      .filter((c) => {
        if (c.isActive === false) return false;
        if (c.applicableOrderTypes && c.applicableOrderTypes.length > 0) {
          return c.applicableOrderTypes.includes(currentOrderType);
        }
        return true;
      })
      .map((c) => {
        let amount = 0;
        if (c.isPercentage) {
          amount = Math.round((taxableAmount * (c.rate || 0)) / 100);
        } else {
          amount = Math.round((c.rate || 0) * 100);
        }
        return {
          id: c._id || c.id || c.name,
          name: c.name,
          rate: c.rate,
          isPercentage: c.isPercentage,
          amount,
        };
      });
  }, [chargeList, currentOrderType, taxableAmount]);

  const totalChargesAmount = applicableCharges.reduce((sum, c) => sum + c.amount, 0);
  const rawTotal = taxableAmount + cgstAmount + sgstAmount + totalChargesAmount;
  const roundOff = Math.round(rawTotal / 100) * 100 - rawTotal;
  const grandTotal = rawTotal + roundOff;

  // Enabled payment modes from outlet configuration
  const enabledModes = useMemo(() => {
    if (!paymentModesList || paymentModesList.length === 0) {
      return [
        { code: 'CASH', name: 'Cash', icon: Banknote },
        { code: 'UPI', name: 'UPI QR', icon: QrCode },
        { code: 'CARD', name: 'Card', icon: CreditCard },
        { code: 'DUE', name: 'Credit/Due', icon: Clock },
      ];
    }
    return paymentModesList
      .filter((m) => m.isEnabled !== false)
      .map((m) => {
        let Icon = CreditCard;
        if (m.code === 'CASH') Icon = Banknote;
        else if (m.code === 'UPI') Icon = QrCode;
        else if (m.code === 'DUE') Icon = Clock;
        return {
          code: m.code,
          name: m.name || m.code,
          icon: Icon,
        };
      });
  }, [paymentModesList]);

  const [cashTendered, setCashTendered] = useState(grandTotal);
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const restaurantUpiId = outlet?.upiId || 'ag7835445-2@okicici';
  const restaurantName = outlet?.name || 'Restaurant';

  // Update default cashTendered if grandTotal updates
  useEffect(() => {
    setCashTendered(grandTotal);
  }, [grandTotal]);

  // Generate dynamic NPCI compliant UPI QR Code with exact amount and restaurant UPI ID
  useEffect(() => {
    const amountInRupees = (grandTotal / 100).toFixed(2);
    const upiUri = `upi://pay?pa=${encodeURIComponent(restaurantUpiId)}&pn=${encodeURIComponent(
      restaurantName
    )}&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent(`Bill ${tableName}`)}`;

    QRCode.toDataURL(upiUri, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setUpiQrUrl(url))
      .catch((err) => console.error('Failed to generate UPI QR code:', err));
  }, [grandTotal, tableName, restaurantUpiId]);

  const changeReturned = Math.max(0, cashTendered - grandTotal);

  const handleApplyDiscount = () => {
    setAppliedDiscount({
      type: discountType,
      value: discountType === 'PERCENT' ? Number(discountValue) : Number(discountValue) * 100,
      reason: discountReason,
    });
    setIsDiscountOpen(false);
  };

  const handleSettle = () => {
    const invoiceNo = `INV-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
    const now = new Date();
    const currentUser = useAuthStore.getState().user;
    const cashierName = currentUser?.name || currentUser?.username || 'Counter Cashier';

    const invoicePayload = {
      invoiceNo,
      tableId,
      tableName,
      orderType: activeOrder?.orderType || currentOrderType || 'DINE_IN',
      guestCount: activeOrder?.guestCount || currentTable?.guestCount || 2,
      outlet: outlet || undefined,
      outletName: outlet?.name || 'Restaurant POS',
      legalName: outlet?.legalName || '',
      gstin: outlet?.gstin || '',
      fssai: outlet?.fssaiNumber || outlet?.fssai || '',
      phone: outlet?.phone || '',
      email: outlet?.email || '',
      address: outlet?.address || '',
      upiId: outlet?.upiId || '',
      lines: billLines.map((l) => {
        const addonsList = Array.isArray(l.addons)
          ? l.addons.map((a) => ({
              id: a.id || a._id,
              name: a.name,
              price: a.price || 0,
            }))
          : [];
        const addonsTotalPerUnit = addonsList.reduce((acc, a) => acc + (a.price || 0), 0);
        return {
          id: l.id || l._id,
          name: l.name,
          variantName: l.variantName || null,
          notes: l.notes || '',
          qty: l.quantity,
          unitPrice: l.unitPrice,
          price: l.unitPrice,
          addons: addonsList,
          addonsTotal: addonsTotalPerUnit * l.quantity,
          total: (l.unitPrice + addonsTotalPerUnit) * l.quantity,
        };
      }),
      subtotal,
      discount: discountAmount,
      discountObj: appliedDiscount,
      discountReason: appliedDiscount?.reason || '',
      taxable: taxableAmount,
      cgstRate,
      sgstRate,
      cgst: cgstAmount,
      sgst: sgstAmount,
      charges: applicableCharges,
      chargesBreakdown: applicableCharges,
      totalCharges: totalChargesAmount,
      roundOff,
      grandTotal,
      paymentMode,
      cashTendered: paymentMode === 'CASH' ? cashTendered : grandTotal,
      changeReturned,
      cardRef: paymentMode === 'CARD' ? cardRef : undefined,
      customerPhone,
      customerName,
      deliveryAddress: activeOrder?.deliveryAddress || '',
      date: now.toLocaleDateString('en-IN'),
      time: now.toLocaleTimeString('en-IN'),
      cashierName,
    };

    // Free the table and store the invoice in posStore
    settleBillAndFreeTable(tableId, invoicePayload);

    try {
      localStorage.setItem('pos_last_settled_invoice', JSON.stringify(invoicePayload));
    } catch {}

    setSettledSuccess(invoicePayload);
  };

  return (
    <div className="min-h-full lg:h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-4 overflow-visible lg:overflow-hidden max-w-7xl mx-auto pb-10 lg:pb-0">
      {/* LEFT PANEL: Bill Preview & Calculations */}
      <div className="w-full flex-1 flex flex-col bg-white border border-slate-200 rounded-xl p-3 sm:p-4 overflow-visible lg:overflow-hidden shadow-xs">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-slate-500 hover:text-slate-900 shrink-0"
              onClick={() => navigate('/tables')}
              title="Back to Floor"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Floor
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5 truncate">
                <Receipt className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Provisional Bill Preview</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium truncate">
                {tableName} • {billLines.length} items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2 sm:px-2.5 gap-1 border-slate-200 text-slate-700 hover:bg-slate-100"
              onClick={() => setIsDiscountOpen(true)}
            >
              <Percent className="w-3 h-3 text-amber-600" />
              <span className="hidden xs:inline">{appliedDiscount ? 'Edit Discount' : 'Discount'}</span>
              <span className="xs:hidden">{appliedDiscount ? 'Disc ✓' : 'Disc'}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2 sm:px-2.5 gap-1 border-slate-200 text-slate-700 hover:bg-slate-100"
              onClick={() => setIsSplitOpen(true)}
            >
              <Split className="w-3 h-3 text-sky-600" />
              Split
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2 sm:px-2.5 gap-1 border-rose-200 text-rose-600 hover:bg-rose-50"
              onClick={() => setIsVoidOpen(true)}
            >
              <Ban className="w-3 h-3" />
              Void
            </Button>
          </div>
        </div>

        {/* Lines Table */}
        <div className="w-full py-2 overflow-x-auto lg:flex-1 lg:overflow-y-auto">
          {billLines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <Receipt className="w-10 h-10 text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-800">No active order for {tableName}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                This table does not have active items yet. Take an order or select an occupied table from the floor.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Button
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 font-semibold"
                  onClick={() => navigate(`/orders?tableId=${tableId}&tableName=${encodeURIComponent(tableName)}`)}
                >
                  Take Order for {tableName}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-300 text-slate-700 text-xs h-8 font-semibold"
                  onClick={() => navigate('/tables')}
                >
                  View Floor Tables
                </Button>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs min-w-full">
              <thead className="bg-slate-50 border-y border-slate-200 uppercase text-[10px] text-slate-500 font-bold">
                <tr>
                  <th className="py-2 px-2 sm:px-3">Item Description</th>
                  <th className="py-2 px-1 sm:px-3 text-center w-12">Qty</th>
                  <th className="py-2 px-2 sm:px-3 text-right">Price</th>
                  <th className="py-2 px-2 sm:px-3 text-right">Gross Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {billLines.map((line) => {
                  const addonsList = Array.isArray(line.addons) ? line.addons : [];
                  const addonsTotal = addonsList.reduce((acc, a) => acc + (a.price || 0), 0);
                  const lineGross = (line.unitPrice + addonsTotal) * line.quantity;
                  return (
                    <tr key={line.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-2 sm:px-3 font-semibold text-slate-900 break-words max-w-[220px]">
                        <div className="font-medium text-slate-900 leading-tight">
                          <span>{line.name}</span>
                          {line.variantName && (
                            <span className="text-slate-600 font-normal ml-1 text-xs">
                              ({line.variantName})
                            </span>
                          )}
                        </div>
                        {addonsList.length > 0 && (
                          <div className="text-[11px] text-slate-600 font-normal mt-1 space-y-0.5 pl-1.5 border-l-2 border-slate-200">
                            {addonsList.map((a, aIdx) => (
                              <div key={aIdx} className="flex justify-between items-center text-slate-600">
                                <span>+ {a.name}</span>
                                {a.price > 0 && (
                                  <span className="text-[10px] text-slate-500 font-medium ml-1">
                                    +{formatPaiseToRupees(a.price)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {line.notes && (
                          <div className="text-[10px] text-amber-700 italic mt-0.5">Note: {line.notes}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-1 sm:px-3 text-center whitespace-nowrap">{line.quantity}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-right font-medium whitespace-nowrap">{formatPaiseToRupees(line.unitPrice)}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatPaiseToRupees(lineGross)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Breakdown Calculation */}
        <div className="border-t border-slate-100 pt-2.5 space-y-1.5 bg-slate-50/70 p-3 rounded-xl border mt-auto">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Item Subtotal</span>
            <span>{formatPaiseToRupees(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-amber-700 font-semibold">
              <span>
                Discount ({appliedDiscount.type === 'PERCENT' ? `${appliedDiscount.value}%` : 'Flat'} - {appliedDiscount.reason})
              </span>
              <span>-{formatPaiseToRupees(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs text-slate-600">
            <span>Taxable Amount</span>
            <span>{formatPaiseToRupees(taxableAmount)}</span>
          </div>

          {applicableCharges.map((c) => (
            <div key={c.id} className="flex justify-between text-xs text-slate-600">
              <span>{c.name} {c.isPercentage ? `(${c.rate}%)` : ''}</span>
              <span>{formatPaiseToRupees(c.amount)}</span>
            </div>
          ))}

          <div className="flex justify-between text-xs text-slate-600">
            <span>CGST ({cgstRate}%)</span>
            <span>{formatPaiseToRupees(cgstAmount)}</span>
          </div>

          <div className="flex justify-between text-xs text-slate-600">
            <span>SGST ({sgstRate}%)</span>
            <span>{formatPaiseToRupees(sgstAmount)}</span>
          </div>

          {roundOff !== 0 && (
            <div className="flex justify-between text-xs text-slate-600">
              <span>Round Off</span>
              <span>{formatPaiseToRupees(roundOff)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Net Payable Total</span>
            <span className="text-base text-slate-900">{formatPaiseToRupees(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Payment Tender Panel */}
      <div className="w-full lg:w-[440px] flex flex-col bg-white border border-slate-200 rounded-xl p-3 sm:p-4 overflow-visible lg:overflow-hidden shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Payment & Settlement</h2>
          <span className="text-base font-bold text-slate-900">{formatPaiseToRupees(grandTotal)}</span>
        </div>

        {/* Mode Selector Tabs (Reflects enabled/disabled status) */}
        <div className="flex flex-wrap gap-1.5 py-2.5 border-b border-slate-100">
          {enabledModes.map((m) => {
            const Icon = m.icon;
            const isSelected = paymentMode === m.code;
            return (
              <button
                key={m.code}
                onClick={() => setPaymentMode(m.code)}
                className={`p-2 rounded-lg border text-center flex-1 min-w-[70px] flex flex-col items-center justify-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 text-slate-700" />
                <span className="text-xs">{m.name}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Mode Forms */}
        <div className="py-3 space-y-3 lg:flex-1 lg:overflow-y-auto no-scrollbar">
          {paymentMode === 'CASH' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Cash Received from Customer</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm font-bold">₹</span>
                  <Input
                    type="number"
                    value={cashTendered / 100}
                    onChange={(e) => setCashTendered(Math.round(Number(e.target.value) * 100))}
                    className="pl-7 text-base font-bold bg-slate-50 border-slate-200 text-slate-900 h-9"
                  />
                </div>
              </div>

              {/* Currency Presets */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Exact', val: grandTotal },
                  { label: '₹500', val: 50000 },
                  { label: '₹1,000', val: 100000 },
                  { label: '₹1,500', val: 150000 },
                  { label: '₹2,000', val: 200000 },
                  { label: '₹3,000', val: 300000 },
                ].map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-200 hover:bg-slate-100 text-xs font-semibold h-8 text-slate-700"
                    onClick={() => setCashTendered(preset.val)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Change Return Card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Change to Return</p>
                  <p
                    className={`text-lg font-bold ${cashTendered < grandTotal ? 'text-rose-600' : 'text-slate-900'
                      }`}
                  >
                    {formatPaiseToRupees(changeReturned)}
                  </p>
                </div>
                {cashTendered < grandTotal && (
                  <span className="text-[11px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Short by {formatPaiseToRupees(grandTotal - cashTendered)}
                  </span>
                )}
              </div>
            </div>
          )}

          {paymentMode === 'UPI' && (
            <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center">
                {upiQrUrl ? (
                  <img
                    src={upiQrUrl}
                    alt={`Scan to pay ${formatPaiseToRupees(grandTotal)}`}
                    className="w-48 h-48 rounded-md object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-slate-300 animate-pulse" />
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1.5 text-[10px] font-bold text-slate-600">
                  <span className="text-emerald-700">Google Pay</span> •{' '}
                  <span className="text-purple-700">PhonePe</span> •{' '}
                  <span className="text-sky-700">Paytm</span> •{' '}
                  <span className="text-orange-700">BHIM</span>
                </div>
              </div>

              <div className="text-center space-y-0.5">
                <p className="text-xs font-semibold text-slate-700">Scan to pay exact bill amount</p>
                <p className="text-base font-bold text-slate-900">{formatPaiseToRupees(grandTotal)}</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  UPI VPA: <span className="font-mono font-bold text-slate-800">{restaurantUpiId}</span>
                </p>
              </div>
            </div>
          )}

          {paymentMode === 'CARD' && (
            <div className="space-y-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-700">Card Swiped Amount</label>
                <Input
                  disabled
                  value={formatPaiseToRupees(grandTotal)}
                  className="bg-slate-100 border-slate-200 font-bold text-slate-900 text-sm mt-1 h-9"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">EDC Terminal RRN / Auth Code</label>
                <Input
                  placeholder="Enter swipe approval code..."
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-xs mt-1 h-9"
                />
              </div>
            </div>
          )}

          {paymentMode === 'DUE' && (
            <div className="space-y-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-700">Customer Mobile</label>
                <Input
                  placeholder="10-digit mobile number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-xs mt-1 h-9"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Customer Name / Company</label>
                <Input
                  placeholder="Customer Full Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-xs mt-1 h-9"
                />
              </div>
              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Amount will be logged in customer credit ledger for future settlement.</span>
              </div>
            </div>
          )}
        </div>

        {/* Settlement CTA Button */}
        <div className="border-t border-slate-100 pt-3">
          <Button
            className="w-full bg-rose-600 hover:bg-rose-700 text-white h-11 text-sm font-bold gap-2 shadow-xs"
            disabled={paymentMode === 'CASH' && cashTendered < grandTotal}
            onClick={handleSettle}
          >
            <CheckCircle2 className="w-4 h-4" />
            Settle Bill & Issue Invoice
          </Button>
        </div>
      </div>

      {/* Discount Modal */}
      {isDiscountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-600" />
                  Apply Bill Discount
                </h3>
                <button onClick={() => setIsDiscountOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={discountType === 'PERCENT' ? 'default' : 'outline'}
                  className={discountType === 'PERCENT' ? 'bg-slate-900 text-white' : 'border-slate-200'}
                  onClick={() => setDiscountType('PERCENT')}
                >
                  Percentage (%)
                </Button>
                <Button
                  type="button"
                  variant={discountType === 'FLAT' ? 'default' : 'outline'}
                  className={discountType === 'FLAT' ? 'bg-slate-900 text-white' : 'border-slate-200'}
                  onClick={() => setDiscountType('FLAT')}
                >
                  Flat Amount (₹)
                </Button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  {discountType === 'PERCENT' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                </label>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="bg-slate-50 border-slate-200 mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Discount Reason</label>
                <Input
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="e.g. Regular Guest, Manager Discretion"
                  className="bg-slate-50 border-slate-200 mt-1 h-9 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" className="text-xs text-slate-600" onClick={() => setIsDiscountOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold" onClick={handleApplyDiscount}>
                  Apply Discount
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Split Bill Modal */}
      {isSplitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Split className="w-4 h-4 text-sky-600" />
                  Split Bill
                </h3>
                <button onClick={() => setIsSplitOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Split Equally Among People:</label>
                <div className="flex items-center gap-1.5 mt-2">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={splitCount === num ? 'default' : 'outline'}
                      className={splitCount === num ? 'bg-slate-900 text-white' : 'border-slate-200 text-slate-700'}
                      onClick={() => setSplitCount(num)}
                    >
                      {num} Ways
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                <p className="text-xs text-slate-500 font-medium">Each Person Pays:</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatPaiseToRupees(Math.round(grandTotal / splitCount))}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" className="text-xs text-slate-600" onClick={() => setIsSplitOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                  onClick={() => setIsSplitOpen(false)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Void Bill (Manager Approval)</h3>
              </div>
              <p className="text-xs text-slate-500">
                Voiding a bill requires manager override PIN and frees the table.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-700">Reason for Voiding:</label>
                <Input
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-xs mt-1 h-9 text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Manager Security PIN:</label>
                <Input
                  type="password"
                  maxLength={4}
                  placeholder="Enter 4-digit PIN"
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-sm mt-1 tracking-widest text-center h-9 text-slate-800 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" className="text-xs text-slate-600" onClick={() => setIsVoidOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs font-semibold"
                  onClick={() => {
                    setIsVoidOpen(false);
                    // Free the table on void
                    settleBillAndFreeTable(tableId, { invoiceNo: 'VOID-' + Date.now() });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Bill Settled Successfully!</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Invoice #{settledSuccess.invoiceNo} issued • {tableName} is now VACANT
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Settled Amount</span>
                  <span className="font-bold text-slate-900">{formatPaiseToRupees(settledSuccess.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Mode</span>
                  <span className="font-bold text-slate-900">{settledSuccess.paymentMode}</span>
                </div>
                {settledSuccess.changeReturned > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Change Returned</span>
                    <span>{formatPaiseToRupees(settledSuccess.changeReturned)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-slate-200 text-xs font-semibold text-slate-700"
                  onClick={() => navigate(`/invoices/preview?no=${settledSuccess.invoiceNo}`)}
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print Receipt
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                  onClick={() => navigate('/tables')}
                >
                  Back to Tables
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
