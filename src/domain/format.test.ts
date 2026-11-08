import { formatCurrency, formatDate, relativeDueLabel } from './format';

describe('formatCurrency', () => {
  test('uses Indian grouping', () => {
    expect(formatCurrency(1000)).toBe('₹1,000');
    expect(formatCurrency(125000)).toBe('₹1,25,000');
    expect(formatCurrency(10000000)).toBe('₹1,00,00,000');
    expect(formatCurrency(500)).toBe('₹500');
  });

  test('shows decimals only when present', () => {
    expect(formatCurrency(1250.5)).toBe('₹1,250.50');
    expect(formatCurrency(1250)).toBe('₹1,250');
  });

  test('handles negatives', () => {
    expect(formatCurrency(-2500)).toBe('-₹2,500');
  });
});

describe('formatDate', () => {
  test('formats ISO dates', () => {
    expect(formatDate('2024-04-10')).toBe('10 Apr 2024');
    expect(formatDate('2023-12-01')).toBe('1 Dec 2023');
  });

  test('handles null and invalid', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('garbage')).toBe('—');
  });
});

describe('relativeDueLabel', () => {
  test('describes upcoming and overdue', () => {
    expect(relativeDueLabel(0)).toBe('Due today');
    expect(relativeDueLabel(1)).toBe('Due tomorrow');
    expect(relativeDueLabel(5)).toBe('Due in 5 days');
    expect(relativeDueLabel(-1)).toBe('Overdue by 1 day');
    expect(relativeDueLabel(-7)).toBe('Overdue by 7 days');
  });
});
