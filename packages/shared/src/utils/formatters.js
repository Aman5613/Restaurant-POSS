/**
 * Format integer paise into INR currency string
 * e.g., 12550 -> "₹125.50"
 */
export function formatPaiseToRupees(paise) {
  const safePaise = Number(paise) || 0;
  const rupees = (safePaise / 100).toFixed(2);
  return `₹${rupees}`;
}

export const formatCurrency = formatPaiseToRupees;

/**
 * Normalizes Indian 10-digit mobile number, stripping spaces, dashes, +91, 0 prefix.
 */
export function normalizePhoneNumber(input) {
  if (!input) return '';
  const digits = String(input).replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

/**
 * Validates Indian GSTIN format (15 characters)
 * 2 digits state code + 10 char PAN + 1 entity code + 1 'Z' + 1 checksum
 */
export function validateGSTIN(gstin) {
  if (!gstin) return false;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(String(gstin).trim().toUpperCase());
}

/**
 * Converts integer paise into Indian currency words
 * e.g., 15000 -> "One Hundred Fifty Rupees Only"
 */
export function amountInWords(paise) {
  const safePaise = Math.round(Number(paise) || 0);
  const rupees = Math.floor(safePaise / 100);
  const remainderPaise = safePaise % 100;

  if (rupees === 0 && remainderPaise === 0) return 'Zero Rupees Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(num) {
    if (num < 20) return ones[num];
    const unit = num % 10;
    return `${tens[Math.floor(num / 10)]}${unit ? ' ' + ones[unit] : ''}`;
  }

  function convertThreeDigits(num) {
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    if (hundred > 0 && rest > 0) {
      return `${ones[hundred]} Hundred ${convertTwoDigits(rest)}`;
    }
    if (hundred > 0) {
      return `${ones[hundred]} Hundred`;
    }
    return convertTwoDigits(rest);
  }

  let words = '';
  let n = rupees;

  // Crores (>= 1,00,00,000)
  const crores = Math.floor(n / 10000000);
  n %= 10000000;
  if (crores > 0) words += `${convertTwoDigits(crores)} Crore `;

  // Lakhs (>= 1,00,000)
  const lakhs = Math.floor(n / 100000);
  n %= 100000;
  if (lakhs > 0) words += `${convertTwoDigits(lakhs)} Lakh `;

  // Thousands (>= 1,000)
  const thousands = Math.floor(n / 1000);
  n %= 1000;
  if (thousands > 0) words += `${convertTwoDigits(thousands)} Thousand `;

  // Remaining 1-999
  if (n > 0) words += convertThreeDigits(n);

  let result = words.trim() ? `${words.trim()} Rupees` : '';

  if (remainderPaise > 0) {
    const paiseText = `${convertTwoDigits(remainderPaise)} Paise`;
    result = result ? `${result} and ${paiseText} Only` : `${paiseText} Only`;
  } else {
    result = `${result} Only`;
  }

  return result;
}
