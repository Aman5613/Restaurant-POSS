import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { formatPaiseToRupees } from '@pos/shared';
import { usePosStore } from '@/stores/pos-store';
import { apiClient } from '@/lib/api-client';

export function InvoicePreviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawInvoiceNo = searchParams.get('no') || searchParams.get('invoiceNo');

  const { getInvoice, outlet: storeOutlet, setOutlet, invoices } = usePosStore();

  // 1. Try to find invoice by requested invoice number
  let stored = rawInvoiceNo ? getInvoice(rawInvoiceNo) : null;

  // 2. Try localStorage fallback (most recently settled invoice in this browser session)
  if (!stored) {
    try {
      const rawLocal = localStorage.getItem('pos_last_settled_invoice');
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (!rawInvoiceNo || parsed.invoiceNo === rawInvoiceNo) {
          stored = parsed;
        }
      }
    } catch {}
  }

  // 3. Try most recent invoice in posStore
  if (!stored && invoices && Object.keys(invoices).length > 0) {
    const keys = Object.keys(invoices);
    stored = invoices[keys[keys.length - 1]];
  }

  const [liveOutlet, setLiveOutlet] = useState(storeOutlet || null);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get('/v1/outlet/profile')
      .then((res) => {
        if (!isMounted) return;
        const o = res?.data?.outlet || res?.data;
        if (o) {
          setLiveOutlet(o);
          setOutlet(o);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [setOutlet]);

  const activeOutlet = stored?.outlet || liveOutlet || storeOutlet || {};
  const outletName = stored?.outletName || activeOutlet.name || 'Restaurant POS';
  const legalName = stored?.legalName || activeOutlet.legalName || '';

  const formatAddress = (addr) => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    return [addr.line1 || addr.street, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
  };

  const formattedAddress = formatAddress(stored?.address || activeOutlet.address);
  const phone = stored?.phone || activeOutlet.phone || '';
  const email = stored?.email || activeOutlet.email || '';
  const gstin = stored?.gstin || activeOutlet.gstin || '';
  const fssai = stored?.fssai || activeOutlet.fssaiNumber || activeOutlet.fssai || '';
  const upiId = stored?.upiId || activeOutlet.upiId || '';

  const invoiceData = stored || {
    invoiceNo: rawInvoiceNo || 'INV-2026-0042',
    outletName,
    legalName,
    gstin,
    fssai,
    address: formattedAddress,
    phone,
    email,
    tableName: 'Counter',
    orderType: 'DINE_IN',
    guestCount: 2,
    cashierName: 'Counter Cashier',
    date: new Date().toLocaleDateString('en-IN'),
    time: new Date().toLocaleTimeString('en-IN'),
    lines: [
      {
        name: 'Paneer Tikka Angara',
        variantName: 'Full (8 pcs)',
        qty: 1,
        unitPrice: 28000,
        price: 28000,
        addons: [{ name: 'Extra Mint Chutney', price: 2000 }],
        addonsTotal: 2000,
        total: 30000,
      },
      {
        name: 'Butter Naan',
        variantName: null,
        qty: 2,
        unitPrice: 6500,
        price: 6500,
        addons: [{ name: 'Garlic Butter Topping', price: 1500 }],
        addonsTotal: 3000,
        total: 16000,
      },
    ],
    subtotal: 46000,
    discount: 0,
    taxable: 46000,
    cgstRate: 2.5,
    sgstRate: 2.5,
    cgst: 1150,
    sgst: 1150,
    chargesBreakdown: [],
    roundOff: 0,
    grandTotal: 48300,
    paymentMode: 'CASH',
    cashTendered: 50000,
    changeReturned: 1700,
  };

  const [upiQrUrl, setUpiQrUrl] = useState('');

  useEffect(() => {
    if (!upiId || !invoiceData.grandTotal) {
      setUpiQrUrl('');
      return;
    }
    const amt = (invoiceData.grandTotal / 100).toFixed(2);
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
      outletName
    )}&am=${amt}&cu=INR&tn=${encodeURIComponent(`Bill ${invoiceData.invoiceNo}`)}`;

    QRCode.toDataURL(upiUri, {
      width: 140,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => setUpiQrUrl(url))
      .catch(() => setUpiQrUrl(''));
  }, [upiId, outletName, invoiceData.grandTotal, invoiceData.invoiceNo]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Print stylesheet scoped to print ONLY the receipt */}
      <style>{`
        @media print {
          /* Hide all surrounding app elements: sidebar, header, buttons */
          body * {
            visibility: hidden !important;
          }
          header, aside, nav, button, .no-print {
            display: none !important;
          }
          #thermal-receipt-paper, #thermal-receipt-paper * {
            visibility: visible !important;
          }
          #thermal-receipt-paper {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Action Bar (hidden during print) */}
      <div className="flex items-center justify-between no-print bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-600 hover:text-slate-900" onClick={() => navigate('/tables')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Floor
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100"
            onClick={() => navigate('/billing')}
          >
            Billing
          </Button>
          <Button
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5 text-xs shadow-xs"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            Print Receipt Only (80mm)
          </Button>
        </div>
      </div>

      {/* 80mm Printable Thermal Paper Container */}
      <div
        id="thermal-receipt-paper"
        className="bg-white text-slate-950 font-mono text-xs shadow-md border border-slate-200 rounded-lg max-w-[360px] mx-auto p-5 select-none print:shadow-none print:border-none print:p-0"
      >
        <div className="space-y-2">
          {/* Header */}
          <div className="text-center space-y-0.5">
            <h2 className="font-bold text-base leading-tight font-sans">
              {invoiceData.outletName || outletName}
            </h2>
            {(invoiceData.legalName || legalName) && (
              <p className="text-[11px] text-slate-600">{invoiceData.legalName || legalName}</p>
            )}
            {(invoiceData.address || formattedAddress) && (
              <p className="text-[10px] text-slate-500 leading-tight">
                {typeof invoiceData.address === 'string' ? invoiceData.address : formattedAddress}
              </p>
            )}
            {(invoiceData.phone || phone || invoiceData.email || email) && (
              <p className="text-[10px] text-slate-500">
                {[
                  (invoiceData.phone || phone) ? `Ph: ${invoiceData.phone || phone}` : '',
                  (invoiceData.email || email),
                ]
                  .filter(Boolean)
                  .join(' | ')}
              </p>
            )}
            {(invoiceData.gstin || gstin || invoiceData.fssai || fssai) && (
              <p className="text-[10px] text-slate-700 font-semibold pt-0.5">
                {[
                  (invoiceData.gstin || gstin) ? `GSTIN: ${invoiceData.gstin || gstin}` : '',
                  (invoiceData.fssai || fssai) ? `FSSAI: ${invoiceData.fssai || fssai}` : '',
                ]
                  .filter(Boolean)
                  .join(' | ')}
              </p>
            )}
          </div>

          <div className="border-t border-b border-dashed border-slate-400 py-1 text-center font-bold tracking-wider">
            TAX INVOICE
          </div>

          <div className="text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>INV NO: {invoiceData.invoiceNo}</span>
              <span>{invoiceData.date}</span>
            </div>
            <div className="flex justify-between">
              <span>
                TABLE: {invoiceData.tableName || 'Counter'}
                {invoiceData.orderType && ` (${invoiceData.orderType.replace('_', ' ')})`}
              </span>
              <span>{invoiceData.time}</span>
            </div>
            {invoiceData.guestCount && (
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>GUESTS: {invoiceData.guestCount}</span>
                <span>CASHIER: {invoiceData.cashierName || 'Counter Cashier'}</span>
              </div>
            )}
            {!invoiceData.guestCount && (
              <div>CASHIER: {invoiceData.cashierName || 'Counter Cashier'}</div>
            )}
            {(invoiceData.customerName || invoiceData.customerPhone) && (
              <div className="text-[10px] text-slate-700 pt-0.5">
                <span>CUSTOMER: {invoiceData.customerName || 'Walk-in'}</span>
                {invoiceData.customerPhone && <span> • {invoiceData.customerPhone}</span>}
              </div>
            )}
            {invoiceData.deliveryAddress && (
              <div className="text-[9px] text-slate-600 leading-tight">
                DELIVERY ADDR: {invoiceData.deliveryAddress}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="border-t border-b border-dashed border-slate-400 py-1.5 space-y-1">
            <div className="flex justify-between font-bold text-[10px] uppercase text-slate-700">
              <span className="w-8 shrink-0">Qty</span>
              <span className="flex-1 text-left px-1">Item</span>
              <span className="w-14 text-right shrink-0">Rate</span>
              <span className="w-16 text-right shrink-0">Amount</span>
            </div>
            <div className="border-t border-dotted border-slate-300" />
            {(invoiceData.lines || []).map((l, i) => {
              const addonsList = Array.isArray(l.addons) ? l.addons : [];
              const unitPrice = l.unitPrice || l.price || 0;
              const lineTotal =
                l.total ||
                (unitPrice + addonsList.reduce((acc, a) => acc + (a.price || 0), 0)) * (l.qty || 1);

              return (
                <div key={i} className="py-1 border-b border-dotted border-slate-200 last:border-b-0 space-y-0.5">
                  <div className="flex justify-between items-start text-[11px] leading-tight">
                    <span className="w-8 font-semibold shrink-0">{l.qty}x</span>
                    <div className="flex-1 text-left px-1 break-words">
                      <span className="font-semibold text-slate-900">{l.name}</span>
                      {l.variantName && (
                        <span className="text-[10px] text-slate-600 font-normal ml-1">
                          ({l.variantName})
                        </span>
                      )}
                    </div>
                    <span className="w-14 text-right text-slate-600 shrink-0">
                      {formatPaiseToRupees(unitPrice)}
                    </span>
                    <span className="w-16 text-right font-bold text-slate-900 shrink-0">
                      {formatPaiseToRupees(lineTotal)}
                    </span>
                  </div>

                  {/* Complete Add-ons Breakdown */}
                  {addonsList.length > 0 && (
                    <div className="pl-8 pr-1 space-y-0.5 text-[10px] text-slate-600">
                      {addonsList.map((addon, aIdx) => (
                        <div key={aIdx} className="flex justify-between items-center italic">
                          <span className="break-words">+ {addon.name}</span>
                          {addon.price > 0 && (
                            <span className="text-slate-500 font-normal">
                              +{formatPaiseToRupees(addon.price)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Special Notes / Instructions */}
                  {l.notes && (
                    <div className="pl-8 text-[9px] text-amber-700 italic">
                      Note: {l.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Breakdown */}
          <div className="text-[11px] space-y-1 pt-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPaiseToRupees(invoiceData.subtotal)}</span>
            </div>
            {invoiceData.discount > 0 && (
              <div className="flex justify-between text-slate-700 font-semibold">
                <span>
                  Discount {invoiceData.discountReason ? `(${invoiceData.discountReason})` : 'Applied'}
                </span>
                <span>-{formatPaiseToRupees(invoiceData.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Taxable Subtotal</span>
              <span>{formatPaiseToRupees(invoiceData.taxable)}</span>
            </div>
            {Array.isArray(invoiceData.chargesBreakdown || invoiceData.charges) &&
              (invoiceData.chargesBreakdown || invoiceData.charges).map((chg, idx) => (
                <div key={idx} className="flex justify-between text-slate-700">
                  <span>{chg.name} {chg.isPercentage ? `(${chg.rate}%)` : ''}</span>
                  <span>{formatPaiseToRupees(chg.amount)}</span>
                </div>
              ))}
            <div className="flex justify-between">
              <span>CGST @ {invoiceData.cgstRate ?? 2.5}%</span>
              <span>{formatPaiseToRupees(invoiceData.cgst)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST @ {invoiceData.sgstRate ?? 2.5}%</span>
              <span>{formatPaiseToRupees(invoiceData.sgst)}</span>
            </div>
            {invoiceData.roundOff !== 0 && (
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Round Off</span>
                <span>{formatPaiseToRupees(invoiceData.roundOff)}</span>
              </div>
            )}
            <div className="border-t-2 border-slate-900 border-dashed pt-1 flex justify-between font-bold text-sm">
              <span>NET GRAND TOTAL</span>
              <span>{formatPaiseToRupees(invoiceData.grandTotal)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border-t border-dashed border-slate-400 pt-1 text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>Mode of Settlement</span>
              <span className="font-bold">{invoiceData.paymentMode}</span>
            </div>
            {invoiceData.paymentMode === 'CASH' && invoiceData.cashTendered && (
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Cash Tendered</span>
                <span>{formatPaiseToRupees(invoiceData.cashTendered)}</span>
              </div>
            )}
            {invoiceData.paymentMode === 'CASH' && invoiceData.changeReturned > 0 && (
              <div className="flex justify-between text-[10px] text-emerald-700 font-bold">
                <span>Change Returned</span>
                <span>{formatPaiseToRupees(invoiceData.changeReturned)}</span>
              </div>
            )}
            {invoiceData.cardRef && (
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Card Ref / RRN</span>
                <span className="font-mono">{invoiceData.cardRef}</span>
              </div>
            )}
            {invoiceData.customerName && (
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Customer</span>
                <span>
                  {invoiceData.customerName} {invoiceData.customerPhone ? `(${invoiceData.customerPhone})` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Dynamic UPI QR Code for quick scan & pay / verification */}
          {upiQrUrl && (
            <div className="border-t border-dashed border-slate-400 pt-2 flex flex-col items-center justify-center text-center">
              <img
                src={upiQrUrl}
                alt="UPI QR Code"
                className="w-24 h-24 border border-slate-200 rounded p-1 bg-white"
              />
              <p className="text-[9px] text-slate-700 mt-1 font-mono font-bold">UPI ID: {upiId}</p>
              <p className="text-[8px] text-slate-500">Scan with any UPI app</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-dashed border-slate-400 pt-2 text-center space-y-1">
            <p className="font-bold">Thank you for dining with us!</p>
            <p className="text-[10px] text-slate-600">Please visit again</p>
            <p className="text-[9px] text-slate-500">Computer generated tax invoice</p>
          </div>
        </div>
      </div>
    </div>
  );
}
