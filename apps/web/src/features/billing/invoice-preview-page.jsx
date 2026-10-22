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
  const invoiceNo = searchParams.get('no') || searchParams.get('invoiceNo') || 'INV-2026-0042';

  const { getInvoice, outlet: storeOutlet, setOutlet } = usePosStore();
  const stored = getInvoice(invoiceNo);

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
    return [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
  };

  const formattedAddress = formatAddress(stored?.address || activeOutlet.address);
  const phone = stored?.phone || activeOutlet.phone || '';
  const email = stored?.email || activeOutlet.email || '';
  const gstin = stored?.gstin || activeOutlet.gstin || '';
  const fssai = stored?.fssai || activeOutlet.fssaiNumber || activeOutlet.fssai || '';
  const upiId = stored?.upiId || activeOutlet.upiId || '';

  const invoiceData = stored || {
    invoiceNo,
    outletName,
    legalName,
    gstin,
    fssai,
    address: formattedAddress,
    phone,
    tableName: 'Table 1',
    cashierName: 'Counter Cashier',
    date: new Date().toLocaleDateString('en-IN'),
    time: new Date().toLocaleTimeString('en-IN'),
    lines: [
      { name: 'Paneer Tikka (Full)', qty: 1, price: 28000, total: 28000 },
      { name: 'Butter Chicken (Full)', qty: 1, price: 39000, total: 39000 },
      { name: 'Butter Naan', qty: 4, price: 6500, total: 26000 },
      { name: 'Masala Chaas', qty: 2, price: 7000, total: 14000 },
    ],
    subtotal: 107000,
    discount: 10700,
    taxable: 96300,
    cgst: 2408,
    sgst: 2408,
    roundOff: -16,
    grandTotal: 101100,
    paymentMode: 'CASH',
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

          <div className="border-t border-b border-dashed border-slate-400 py-1 text-center font-bold">
            TAX INVOICE
          </div>

          <div className="text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>INV NO: {invoiceData.invoiceNo}</span>
              <span>{invoiceData.date}</span>
            </div>
            <div className="flex justify-between">
              <span>TABLE: {invoiceData.tableName}</span>
              <span>{invoiceData.time}</span>
            </div>
            <div>CASHIER: {invoiceData.cashierName || 'Counter Cashier'}</div>
          </div>

          {/* Items Table */}
          <div className="border-t border-b border-dashed border-slate-400 py-1.5 space-y-1">
            <div className="flex justify-between font-bold text-[10px] uppercase text-slate-700">
              <span className="w-8">Qty</span>
              <span className="flex-1 text-left">Item</span>
              <span className="w-12 text-right">Rate</span>
              <span className="w-16 text-right">Amount</span>
            </div>
            <div className="border-t border-dotted border-slate-300" />
            {invoiceData.lines.map((l, i) => (
              <div key={i} className="flex justify-between text-[11px]">
                <span className="w-8">{l.qty}x</span>
                <span className="flex-1 text-left truncate pr-1">{l.name}</span>
                <span className="w-12 text-right">{formatPaiseToRupees(l.price)}</span>
                <span className="w-16 text-right font-semibold">{formatPaiseToRupees(l.total)}</span>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div className="text-[11px] space-y-1 pt-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPaiseToRupees(invoiceData.subtotal)}</span>
            </div>
            {invoiceData.discount > 0 && (
              <div className="flex justify-between text-slate-700 font-semibold">
                <span>Discount Applied</span>
                <span>-{formatPaiseToRupees(invoiceData.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Taxable Subtotal</span>
              <span>{formatPaiseToRupees(invoiceData.taxable)}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST @ 2.5%</span>
              <span>{formatPaiseToRupees(invoiceData.cgst)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST @ 2.5%</span>
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
          <div className="border-t border-dashed border-slate-400 pt-1 text-[11px]">
            <div className="flex justify-between">
              <span>Mode of Settlement</span>
              <span className="font-bold">{invoiceData.paymentMode}</span>
            </div>
            {invoiceData.customerName && (
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Customer</span>
                <span>{invoiceData.customerName}</span>
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
