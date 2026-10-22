import { formatPaiseToRupees } from '../utils/formatters.js';

export function formatInvoiceReceipt({
  outlet = {},
  invoiceNo,
  tableName = 'Counter',
  cashierName = 'Cashier',
  issuedAt = new Date(),
  lines = [],
  subtotal = 0,
  discountAmount = 0,
  taxBreakup = { cgst: 0, sgst: 0 },
  chargesTotal = 0,
  roundOff = 0,
  grandTotal = 0,
  payments = [],
  width = 42,
}) {
  const hr = '-'.repeat(width);
  const doubleHr = '='.repeat(width);
  const buffer = [];

  const center = (text) => text.padStart(Math.floor((width + text.length) / 2));

  // Header
  buffer.push(center(outlet.name || 'RESTAURANT POS'));
  const legalName = outlet.legalName || outlet.legal_name;
  if (legalName) buffer.push(center(legalName));

  const addrStr = typeof outlet.address === 'string'
    ? outlet.address
    : [
        outlet.address?.line1,
        outlet.address?.line2,
        outlet.address?.city,
        outlet.address?.state,
        outlet.address?.pincode,
      ]
        .filter(Boolean)
        .join(', ');
  if (addrStr) buffer.push(center(addrStr));

  if (outlet.phone) buffer.push(center(`Ph: ${outlet.phone}`));
  if (outlet.email) buffer.push(center(outlet.email));

  const gstin = outlet.gstin;
  const fssai = outlet.fssaiNumber || outlet.fssai;
  if (gstin || fssai) {
    const taxLine = [gstin ? `GSTIN: ${gstin}` : '', fssai ? `FSSAI: ${fssai}` : '']
      .filter(Boolean)
      .join(' | ');
    buffer.push(center(taxLine));
  }
  if (outlet.upiId) buffer.push(center(`UPI: ${outlet.upiId}`));

  buffer.push(doubleHr);
  buffer.push(center('TAX INVOICE'));
  buffer.push(doubleHr);

  buffer.push(`INV NO : ${invoiceNo}`);
  buffer.push(`DATE   : ${new Date(issuedAt).toLocaleString('en-IN')}`);
  buffer.push(`TABLE  : ${tableName.toUpperCase()} | CASHIER: ${cashierName}`);
  buffer.push(hr);

  // Line Items
  buffer.push('QTY  ITEM                   PRICE     AMOUNT');
  buffer.push(hr);

  for (const line of lines) {
    const qtyVal = line.quantity ?? line.qty ?? 1;
    const qty = `${qtyVal}x`.padEnd(5);
    const lineName = line.name || 'Item';
    const name = (lineName.length > 20 ? lineName.substring(0, 19) + '.' : lineName).padEnd(21);
    const unitPriceVal = line.unit_price ?? line.price ?? 0;
    const unit = `₹${formatPaiseToRupees(unitPriceVal)}`.padStart(7);
    const amtVal = line.total_amount ?? line.total ?? line.gross_amount ?? (unitPriceVal * qtyVal);
    const amt = `₹${formatPaiseToRupees(amtVal)}`.padStart(9);

    buffer.push(`${qty}${name}${unit}${amt}`);
  }

  buffer.push(hr);

  // Totals
  const padLabel = (lbl, val) => `${lbl.padEnd(25)}: ${val.padStart(width - 27)}`;

  buffer.push(padLabel('Subtotal', `₹${formatPaiseToRupees(subtotal)}`));
  if (discountAmount > 0) {
    buffer.push(padLabel('Discount Applied', `-₹${formatPaiseToRupees(discountAmount)}`));
  }
  if (taxBreakup.cgst > 0) {
    buffer.push(padLabel('CGST (2.5%)', `₹${formatPaiseToRupees(taxBreakup.cgst)}`));
  }
  if (taxBreakup.sgst > 0) {
    buffer.push(padLabel('SGST (2.5%)', `₹${formatPaiseToRupees(taxBreakup.sgst)}`));
  }
  if (chargesTotal > 0) {
    buffer.push(padLabel('Service/Other Charges', `₹${formatPaiseToRupees(chargesTotal)}`));
  }
  if (roundOff !== 0) {
    buffer.push(padLabel('Round Off', `₹${formatPaiseToRupees(roundOff)}`));
  }

  buffer.push(doubleHr);
  buffer.push(padLabel('GRAND TOTAL', `₹${formatPaiseToRupees(grandTotal)}`));
  buffer.push(doubleHr);

  // Payments
  if (payments.length > 0) {
    buffer.push('PAYMENT SUMMARY:');
    for (const p of payments) {
      buffer.push(`  ${p.mode.padEnd(15)} : ₹${formatPaiseToRupees(p.amount)}`);
    }
    buffer.push(hr);
  }

  // Footer
  buffer.push(center('Thank you for dining with us!'));
  buffer.push(center('Please visit again'));
  buffer.push(center('This is a computer generated invoice'));
  buffer.push('');

  return buffer.join('\n');
}
