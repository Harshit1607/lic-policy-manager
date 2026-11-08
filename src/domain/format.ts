import { ISODate, isISODate, parseISODate } from './date';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Format rupees with Indian grouping, e.g. 125000 -> "₹1,25,000". */
export function formatCurrency(amount: number): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const negative = rounded < 0;
  const [intPart, decPart] = Math.abs(rounded).toFixed(2).split('.');
  // Indian grouping: last 3 digits, then groups of 2.
  let grouped = intPart;
  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  const decimals = decPart === '00' ? '' : `.${decPart}`;
  return `${negative ? '-' : ''}₹${grouped}${decimals}`;
}

/** Format an ISO date as "10 Apr 2024". Returns '—' for null/invalid. */
export function formatDate(value: ISODate | null | undefined): string {
  if (!value || !isISODate(value)) return '—';
  const { year, month, day } = parseISODate(value);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** Human-friendly relative label for a due date vs today. */
export function relativeDueLabel(days: number): string {
  if (days === 0) return 'Due today';
  if (days > 0) return days === 1 ? 'Due tomorrow' : `Due in ${days} days`;
  const overdue = -days;
  return overdue === 1 ? 'Overdue by 1 day' : `Overdue by ${overdue} days`;
}
