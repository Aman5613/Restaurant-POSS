import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, CheckCircle2, QrCode } from 'lucide-react';
import { formatPaiseToRupees } from '@pos/shared';

export function InvoicePreviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceNo = searchParams.get('no') || 'INV-2026-0042';

  const invoiceData = {
    invoiceNo,
    outletName: 'Spice Garden - Bandra',
    legalName: 'Spice Garden Pvt Ltd',
    gstin: '27AAPFU0939F1ZV',
    fssai: '11521034000123',
    address: '12 Linking Road, Bandra West, Mumbai - 400050',
    phone: '+91 98765 43210',
    tableName: 'Table 1 (Ground Floor AC)',
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate('/tables')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Floor
        </Button>
        <Button className="bg-emerald-600 hover:bg-emerald-500 gap-1.5" onClick={handlePrint}>
          <Printer className="w-4 h-4" />
          Print Thermal Receipt
        </Button>
      </div>

      {/* 80mm Printable Thermal Paper Container */}
      <Card className="bg-white text-slate-950 font-mono text-xs shadow-2xl border-none max-w-[360px] mx-auto p-5 select-none print:shadow-none print:p-0">
        <CardContent className="p-0 space-y-2">
          {/* Header */}
          <div className="text-center space-y-0.5">
            <h2 className="font-bold text-base leading-tight font-sans">{invoiceData.outletName}</h2>
            <p className="text-[11px] text-slate-600">{invoiceData.legalName}</p>
            <p className="text-[10px] text-slate-500 leading-tight">{invoiceData.address}</p>
            <p className="text-[10px] text-slate-500">Ph: {invoiceData.phone}</p>
            <p className="text-[10px] text-slate-700 font-semibold pt-0.5">
              GSTIN: {invoiceData.gstin} | FSSAI: {invoiceData.fssai}
            </p>
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
            <div>CASHIER: {invoiceData.cashierName}</div>
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
                <span className="w-12 text-right">₹{formatPaiseToRupees(l.price)}</span>
                <span className="w-16 text-right font-semibold">₹{formatPaiseToRupees(l.total)}</span>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div className="text-[11px] space-y-1 pt-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{formatPaiseToRupees(invoiceData.subtotal)}</span>
            </div>
            {invoiceData.discount > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Discount Applied</span>
                <span>-₹{formatPaiseToRupees(invoiceData.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Taxable Subtotal</span>
              <span>₹{formatPaiseToRupees(invoiceData.taxable)}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST @ 2.5%</span>
              <span>₹{formatPaiseToRupees(invoiceData.cgst)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST @ 2.5%</span>
              <span>₹{formatPaiseToRupees(invoiceData.sgst)}</span>
            </div>
            {invoiceData.roundOff !== 0 && (
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Round Off</span>
                <span>₹{formatPaiseToRupees(invoiceData.roundOff)}</span>
              </div>
            )}
            <div className="border-t-2 border-slate-900 border-dashed pt-1 flex justify-between font-bold text-sm">
              <span>NET GRAND TOTAL</span>
              <span>₹{formatPaiseToRupees(invoiceData.grandTotal)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border-t border-dashed border-slate-400 pt-1 text-[11px]">
            <div className="flex justify-between">
              <span>Mode of Settlement</span>
              <span className="font-bold">{invoiceData.paymentMode}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-dashed border-slate-400 pt-2 text-center space-y-1">
            <p className="font-bold">Thank you for dining with us!</p>
            <p className="text-[10px] text-slate-600">Please visit again</p>
            <p className="text-[9px] text-slate-500">Computer generated invoice</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
