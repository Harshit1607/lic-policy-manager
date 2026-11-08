import { addDays, addMonths, addYears, compareISO, diffDays, daysInMonth, todayISO } from './date';

describe('date utilities', () => {
  test('addMonths advances months', () => {
    expect(addMonths('2024-01-15', 1)).toBe('2024-02-15');
    expect(addMonths('2024-01-15', 3)).toBe('2024-04-15');
    expect(addMonths('2024-11-15', 3)).toBe('2025-02-15');
  });

  test('addMonths clamps to month end', () => {
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29'); // leap year
    expect(addMonths('2023-01-31', 1)).toBe('2023-02-28');
    expect(addMonths('2024-01-31', 3)).toBe('2024-04-30');
  });

  test('addMonths handles negative months', () => {
    expect(addMonths('2024-03-15', -1)).toBe('2024-02-15');
    expect(addMonths('2024-01-15', -1)).toBe('2023-12-15');
  });

  test('addYears advances by whole years', () => {
    expect(addYears('2024-02-29', 1)).toBe('2025-02-28');
    expect(addYears('2020-06-01', 20)).toBe('2040-06-01');
  });

  test('addDays crosses month and year boundaries', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-12-31', 1)).toBe('2025-01-01');
    expect(addDays('2024-03-15', 30)).toBe('2024-04-14');
  });

  test('diffDays measures day distance', () => {
    expect(diffDays('2024-03-15', '2024-03-01')).toBe(14);
    expect(diffDays('2024-03-01', '2024-03-15')).toBe(-14);
    expect(diffDays('2025-01-01', '2024-12-31')).toBe(1);
  });

  test('compareISO orders dates', () => {
    expect(compareISO('2024-01-01', '2024-06-01')).toBe(-1);
    expect(compareISO('2024-06-01', '2024-01-01')).toBe(1);
    expect(compareISO('2024-06-01', '2024-06-01')).toBe(0);
  });

  test('daysInMonth is correct', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(2024, 4)).toBe(30);
  });

  test('todayISO formats the provided date', () => {
    expect(todayISO(new Date(2024, 0, 5))).toBe('2024-01-05');
  });
});
