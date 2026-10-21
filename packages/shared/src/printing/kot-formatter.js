/**
 * Formats a KOT ticket payload into a structured thermal printer layout (ASCII / ESC/POS friendly).
 */
export function formatKotTicket({
  kotNo,
  orderNo,
  tableName,
  stationName,
  type = 'REGULAR',
  captainName = 'Staff',
  guestCount = 1,
  createdAt = new Date(),
  lines = [],
  reprintReason = null,
  width = 42, // standard 80mm column width
}) {
  const hr = '-'.repeat(width);
  const doubleHr = '='.repeat(width);

  const buffer = [];

  // Type banner
  if (type === 'CANCEL') {
    buffer.push('*** CANCEL SLIP ***'.padStart(Math.floor((width + 19) / 2)));
  } else if (type === 'MODIFY') {
    buffer.push('*** ORDER MODIFICATION ***'.padStart(Math.floor((width + 26) / 2)));
  } else if (reprintReason) {
    buffer.push('*** DUPLICATE REPRINT ***'.padStart(Math.floor((width + 25) / 2)));
  }

  // Header
  buffer.push(doubleHr);
  buffer.push(`KITCHEN STATION: ${stationName.toUpperCase()}`);
  buffer.push(`KOT NO : ${kotNo} | ORDER: ${orderNo}`);
  buffer.push(`TABLE  : ${tableName.toUpperCase()} | GUESTS: ${guestCount}`);
  buffer.push(`SERVER : ${captainName} | TIME: ${new Date(createdAt).toLocaleTimeString('en-IN')}`);
  if (reprintReason) {
    buffer.push(`REASON : ${reprintReason}`);
  }
  buffer.push(hr);

  // Group by course if present
  const courses = ['starter', 'main', 'dessert', 'beverage', 'general'];
  for (const course of courses) {
    const courseLines = lines.filter((l) => (l.course || 'general').toLowerCase() === course);
    if (courseLines.length === 0) continue;

    if (course !== 'general') {
      buffer.push(`-- [${course.toUpperCase()}] --`);
    }

    for (const line of courseLines) {
      const qtyStr = `${line.quantity}x`.padEnd(5);
      const nameStr = `${line.name}${line.variant_name ? ` (${line.variant_name})` : ''}`;
      buffer.push(`${qtyStr} ${nameStr}`);

      if (line.addons && line.addons.length > 0) {
        for (const addon of line.addons) {
          buffer.push(`      + ${addon.name}`);
        }
      }

      if (line.notes) {
        buffer.push(`      >> NOTE: ${line.notes}`);
      }
    }
  }

  buffer.push(doubleHr);
  buffer.push(''.padStart(Math.floor((width + 12) / 2), ' '));

  return buffer.join('\n');
}
