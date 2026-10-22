/**
 * Billing Engine for Restaurant POS
 * CRITICAL RULE: All monetary amounts are in integer paise (1 INR = 100 paise).
 * No floating point math for currency.
 */

/**
 * Calculates line items, taxes, charges, discounts and final rounded payable.
 *
 * @param {Object} params
 * @param {Array} params.items Array of order lines
 * @param {Object} [params.billDiscount] { type: 'PERCENT' | 'FLAT', value: number } (value in percentage or paise)
 * @param {Array} [params.charges] Array of extra charges: { name: string, rate: number, isPercentage: boolean, taxRate: number, isInclusive: boolean }
 * @param {boolean} [params.isInterState] If true, computes IGST instead of CGST+SGST
 * @returns {Object} Full breakdown of the calculation in paise
 */
export function calculateBill({
  items = [],
  billDiscount = null,
  charges = [],
  isInterState = false,
} = {}) {
  let subtotal = 0;
  let totalItemDiscounts = 0;

  // Step 1: Calculate raw line gross amounts & line discounts
  const calculatedLines = items.map((item, index) => {
    const unitPrice = Math.round(item.unitPrice || 0); // paise
    const qty = Math.max(1, item.quantity || 1);
    const addonsTotal = (item.addons || []).reduce(
      (sum, addon) => sum + Math.round(addon.price || 0),
      0
    );

    const gross = (unitPrice + addonsTotal) * qty;
    subtotal += gross;

    // Line level discount
    let lineDiscount = 0;
    if (item.discount) {
      if (item.discount.type === 'PERCENT') {
        lineDiscount = Math.round((gross * item.discount.value) / 100);
      } else if (item.discount.type === 'FLAT') {
        lineDiscount = Math.min(gross, Math.round(item.discount.value || 0));
      }
    }
    totalItemDiscounts += lineDiscount;

    return {
      index,
      itemId: item.itemId,
      name: item.name,
      quantity: qty,
      unitPrice,
      addons: item.addons || [],
      gross,
      lineDiscount,
      netBeforeBillDiscount: gross - lineDiscount,
      taxRate: Number(item.taxRate || 0), // e.g. 5 for 5%
      isTaxInclusive: Boolean(item.isTaxInclusive),
      isDiscountable: item.isDiscountable !== false,
    };
  });

  // Step 2: Calculate bill-level discount and distribute proportionally
  let totalBillDiscount = 0;
  const discountableNetTotal = calculatedLines
    .filter((l) => l.isDiscountable)
    .reduce((sum, l) => sum + l.netBeforeBillDiscount, 0);

  if (billDiscount && discountableNetTotal > 0) {
    if (billDiscount.type === 'PERCENT') {
      totalBillDiscount = Math.round((discountableNetTotal * billDiscount.value) / 100);
    } else if (billDiscount.type === 'FLAT') {
      totalBillDiscount = Math.min(discountableNetTotal, Math.round(billDiscount.value || 0));
    }
  }

  // Allocate bill discount across lines proportionally
  let distributedBillDiscount = 0;
  const linesWithAllDiscounts = calculatedLines.map((line, idx, arr) => {
    let allocated = 0;
    if (line.isDiscountable && totalBillDiscount > 0) {
      // Last item gets remainder to avoid rounding drift
      const isLastDiscountable =
        idx === arr.map((l, i) => (l.isDiscountable ? i : -1)).filter((i) => i >= 0).pop();

      if (isLastDiscountable) {
        allocated = totalBillDiscount - distributedBillDiscount;
      } else {
        allocated = Math.round(
          (line.netBeforeBillDiscount / discountableNetTotal) * totalBillDiscount
        );
        distributedBillDiscount += allocated;
      }
    }

    const netTaxableBase = Math.max(0, line.netBeforeBillDiscount - allocated);

    return {
      ...line,
      allocatedBillDiscount: allocated,
      totalDiscount: line.lineDiscount + allocated,
      netTaxableBase,
    };
  });

  // Step 3: Tax calculations per line
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalTax = 0;

  const linesWithTax = linesWithAllDiscounts.map((line) => {
    let taxAmount = 0;
    let taxableAmount = line.netTaxableBase;

    if (line.taxRate > 0) {
      if (line.isTaxInclusive) {
        // Inclusive tax back-calculation
        taxableAmount = Math.round((line.netTaxableBase * 10000) / (10000 + line.taxRate * 100));
        taxAmount = line.netTaxableBase - taxableAmount;
      } else {
        // Exclusive tax addition
        taxAmount = Math.round((line.netTaxableBase * line.taxRate) / 100);
      }
    }

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = taxAmount;
      totalIgst += igst;
    } else {
      cgst = Math.floor(taxAmount / 2);
      sgst = taxAmount - cgst; // Remainder to SGST
      totalCgst += cgst;
      totalSgst += sgst;
    }
    totalTax += taxAmount;

    return {
      ...line,
      taxableAmount,
      taxAmount,
      cgst,
      sgst,
      igst,
      finalAmount: line.isTaxInclusive
        ? line.netTaxableBase
        : line.netTaxableBase + taxAmount,
    };
  });

  // Step 4: Calculate additional charges
  let totalCharges = 0;
  const processedCharges = (charges || []).map((ch) => {
    let amount = 0;
    if (ch.isPercentage) {
      // Percentage applied on subtotal after discounts
      const baseForCharge = Math.max(0, subtotal - totalItemDiscounts - totalBillDiscount);
      amount = Math.round((baseForCharge * ch.rate) / 100);
    } else {
      amount = Math.round(ch.rate || 0);
    }

    let chargeTax = 0;
    let chargeCgst = 0;
    let chargeSgst = 0;
    let chargeIgst = 0;

    if (ch.taxRate && ch.taxRate > 0) {
      if (ch.isInclusive) {
        const taxable = Math.round((amount * 10000) / (10000 + ch.taxRate * 100));
        chargeTax = amount - taxable;
      } else {
        chargeTax = Math.round((amount * ch.taxRate) / 100);
      }

      if (isInterState) {
        chargeIgst = chargeTax;
        totalIgst += chargeIgst;
      } else {
        chargeCgst = Math.floor(chargeTax / 2);
        chargeSgst = chargeTax - chargeCgst;
        totalCgst += chargeCgst;
        totalSgst += chargeSgst;
      }
      totalTax += chargeTax;
    }

    const netCharge = ch.isInclusive ? amount : amount + chargeTax;
    totalCharges += netCharge;

    return {
      name: ch.name,
      rate: ch.rate,
      amount,
      taxRate: ch.taxRate || 0,
      taxAmount: chargeTax,
      cgst: chargeCgst,
      sgst: chargeSgst,
      igst: chargeIgst,
      total: netCharge,
    };
  });

  // Step 5: Final sum and round-off
  const rawTotal =
    linesWithTax.reduce((sum, l) => sum + l.finalAmount, 0) + totalCharges;

  // Round to nearest rupee (100 paise)
  const roundedPayable = Math.round(rawTotal / 100) * 100;
  const roundOff = roundedPayable - rawTotal;

  return {
    subtotal,
    itemDiscountTotal: totalItemDiscounts,
    billDiscountTotal: totalBillDiscount,
    totalDiscount: totalItemDiscounts + totalBillDiscount,
    taxes: {
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      total: totalTax,
    },
    charges: processedCharges,
    totalCharges,
    rawTotal,
    roundOff,
    payableAmount: roundedPayable, // In paise
    lines: linesWithTax,
  };
}

/**
 * Adapter function matching the billing.service interface
 */
export function computeBill({
  lines = [],
  items = [],
  discount = null,
  billDiscount = null,
  charges = [],
  isInterState = false,
} = {}) {
  const lineItems = lines.length > 0 ? lines : items;
  const activeDiscount = discount || billDiscount;

  const result = calculateBill({
    items: lineItems,
    billDiscount: activeDiscount,
    charges,
    isInterState,
  });

  return {
    ...result,
    discountTotal: result.totalDiscount,
    cgstTotal: result.taxes.cgst,
    sgstTotal: result.taxes.sgst,
    igstTotal: result.taxes.igst,
    chargesTotal: result.totalCharges,
    grandTotal: result.payableAmount,
    lines: result.lines.map((l) => ({
      ...l,
      grossAmount: l.gross,
      lineDiscountAmount: l.lineDiscount,
      cgstAmount: l.cgst,
      sgstAmount: l.sgst,
      igstAmount: l.igst,
      totalAmount: l.finalAmount,
    })),
  };
}

