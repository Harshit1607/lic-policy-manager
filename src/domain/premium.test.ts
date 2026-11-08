import {
  commissionForAmount,
  computePolicyStatus,
  dueCountAsOf,
  dueDateForIndex,
  graceEndForDueDate,
  instalmentsInMonth,
  maturityDate,
  totalCommission,
  totalPremiums,
} from './premium';
import type { PremiumSchedulable } from './premium';

const yearly: PremiumSchedulable = {
  commencementDate: '2020-04-10',
  policyTermYears: 20,
  premiumPayingTermYears: 20,
  premiumMode: 'yearly',
  premiumAmount: 25000,
};

const monthly: PremiumSchedulable = {
  commencementDate: '2023-01-15',
  policyTermYears: 15,
  premiumPayingTermYears: 10,
  premiumMode: 'monthly',
  premiumAmount: 2000,
};

const quarterly: PremiumSchedulable = {
  commencementDate: '2022-06-30',
  policyTermYears: 16,
  premiumPayingTermYears: 16,
  premiumMode: 'quarterly',
  premiumAmount: 7500,
};

describe('schedule basics', () => {
  test('totalPremiums depends on mode and paying term', () => {
    expect(totalPremiums(yearly)).toBe(20);
    expect(totalPremiums(monthly)).toBe(120);
    expect(totalPremiums(quarterly)).toBe(64);
  });

  test('maturityDate is commencement + policy term', () => {
    expect(maturityDate(yearly)).toBe('2040-04-10');
    expect(maturityDate(monthly)).toBe('2038-01-15');
  });

  test('dueDateForIndex steps by the mode interval', () => {
    expect(dueDateForIndex(yearly, 0)).toBe('2020-04-10');
    expect(dueDateForIndex(yearly, 1)).toBe('2021-04-10');
    expect(dueDateForIndex(monthly, 0)).toBe('2023-01-15');
    expect(dueDateForIndex(monthly, 2)).toBe('2023-03-15');
    expect(dueDateForIndex(quarterly, 1)).toBe('2022-09-30');
    // clamp to month end: 2022-06-30 + 6 months = 2022-12-30
    expect(dueDateForIndex(quarterly, 2)).toBe('2022-12-30');
  });

  test('graceEndForDueDate applies LIC 15/30 day rule', () => {
    expect(graceEndForDueDate('2024-01-15', 'monthly')).toBe('2024-01-30');
    expect(graceEndForDueDate('2024-01-15', 'quarterly')).toBe('2024-02-14');
    expect(graceEndForDueDate('2024-01-15', 'yearly')).toBe('2024-02-14');
  });

  test('dueCountAsOf counts reached instalments', () => {
    expect(dueCountAsOf(yearly, '2020-04-09')).toBe(0);
    expect(dueCountAsOf(yearly, '2020-04-10')).toBe(1);
    expect(dueCountAsOf(yearly, '2022-05-01')).toBe(3);
    // never exceeds total
    expect(dueCountAsOf(yearly, '2099-01-01')).toBe(20);
  });
});

describe('computePolicyStatus', () => {
  test('active before any due date reached and outside reminder window', () => {
    const s = computePolicyStatus(yearly, 0, '2020-01-01', 30);
    expect(s.status).toBe('active');
    expect(s.nextDueDate).toBe('2020-04-10');
    expect(s.overdueAmount).toBe(0);
  });

  test('due_soon when next due is within the reminder window', () => {
    const s = computePolicyStatus(yearly, 1, '2021-03-20', 30);
    expect(s.status).toBe('due_soon');
    expect(s.nextDueDate).toBe('2021-04-10');
  });

  test('overdue within the grace period', () => {
    // yearly grace = 30 days; due 2021-04-10, grace ends 2021-05-10
    const s = computePolicyStatus(yearly, 1, '2021-04-25', 30);
    expect(s.status).toBe('overdue');
    expect(s.graceEndDate).toBe('2021-05-10');
    expect(s.overdueCount).toBe(1);
    expect(s.overdueAmount).toBe(25000);
  });

  test('lapsed once the grace period elapses', () => {
    const s = computePolicyStatus(yearly, 1, '2021-05-11', 30);
    expect(s.status).toBe('lapsed');
    expect(s.overdueCount).toBe(1);
  });

  test('monthly grace is 15 days', () => {
    // due 2023-02-15 (index 1), grace ends 2023-03-02
    const inGrace = computePolicyStatus(monthly, 1, '2023-03-01', 7);
    expect(inGrace.status).toBe('overdue');
    const lapsed = computePolicyStatus(monthly, 1, '2023-03-03', 7);
    expect(lapsed.status).toBe('lapsed');
  });

  test('overdue amount accumulates multiple missed instalments', () => {
    // by 2023-05-20, monthly instalments due at indices 0..4 (Jan-May) = 5
    const s = computePolicyStatus(monthly, 2, '2023-05-20', 7);
    expect(s.overdueCount).toBe(3);
    expect(s.overdueAmount).toBe(6000);
    expect(s.nextDueDate).toBe('2023-03-15'); // earliest unpaid
  });

  test('fully_paid when all premiums settled before maturity', () => {
    const s = computePolicyStatus(yearly, 20, '2041-01-01', 30);
    // after maturity date -> matured takes precedence
    expect(s.status).toBe('matured');
    const before = computePolicyStatus(monthly, 120, '2033-06-01', 30);
    expect(before.status).toBe('fully_paid');
    expect(before.nextDueDate).toBeNull();
  });

  test('matured after policy term regardless of payments', () => {
    const s = computePolicyStatus(yearly, 5, '2040-04-10', 30);
    expect(s.status).toBe('matured');
  });

  test('a premium is not overdue on its due date', () => {
    // second yearly premium falls due 2021-04-10
    const s = computePolicyStatus(yearly, 1, '2021-04-10', 30);
    expect(s.status).toBe('due_soon');
    expect(s.overdueCount).toBe(0);
    expect(s.overdueAmount).toBe(0);
  });

  test('an instalment due today is not counted alongside an older missed one', () => {
    // 2021-04-10 missed; 2022-04-10 falls due today
    const s = computePolicyStatus(yearly, 1, '2022-04-10', 30);
    expect(s.status).toBe('lapsed');
    expect(s.overdueCount).toBe(1);
    expect(s.overdueAmount).toBe(25000);
  });

  test('paidCount is clamped to total premiums', () => {
    const s = computePolicyStatus(yearly, 999, '2030-01-01', 30);
    expect(s.paidCount).toBe(20);
    expect(s.status).toBe('fully_paid');
  });
});

describe('premiums paid up to', () => {
  // yearly from 2020-04-10: premiums due every 10 April
  test('an old policy paid up to last year is neither overdue nor lapsed', () => {
    const s = computePolicyStatus({ ...yearly, premiumsPaidUpTo: '2025-04-10' }, 0, '2026-01-01', 30);
    expect(s.status).toBe('active');
    expect(s.paidCount).toBe(6);
    expect(s.overdueCount).toBe(0);
    expect(s.overdueAmount).toBe(0);
    expect(s.nextDueDate).toBe('2026-04-10');
  });

  test('blank keeps every premium since commencement unpaid', () => {
    const s = computePolicyStatus({ ...yearly, premiumsPaidUpTo: null }, 0, '2026-01-01', 30);
    expect(s.status).toBe('lapsed');
    expect(s.overdueCount).toBe(6);
    expect(s.nextDueDate).toBe('2020-04-10');
  });

  test('payments recorded in the app settle instalments after the baseline', () => {
    const s = computePolicyStatus({ ...yearly, premiumsPaidUpTo: '2024-04-10' }, 1, '2026-01-01', 30);
    expect(s.paidCount).toBe(6);
    expect(s.nextDueDate).toBe('2026-04-10');
  });

  test('monthly collection counts the baseline as settled', () => {
    const policy = { ...yearly, premiumsPaidUpTo: '2024-04-10' };
    expect(instalmentsInMonth(policy, 0, '2024-04-01').paid).toBe(1);
    expect(instalmentsInMonth(policy, 0, '2025-04-01').paid).toBe(0);
  });
});

describe('commission', () => {
  test('commissionForAmount applies the policy rate', () => {
    expect(commissionForAmount({ commissionRate: 5 }, 25000)).toBe(1250);
    expect(commissionForAmount({ commissionRate: 2.5 }, 2000)).toBe(50);
  });

  test('totalCommission sums across payments', () => {
    expect(
      totalCommission({ commissionRate: 5 }, [{ amount: 25000 }, { amount: 25000 }, { amount: 25000 }]),
    ).toBe(3750);
  });
});

describe('instalmentsInMonth', () => {
  test('monthly policy has one instalment per month; settled when paidCount covers it', () => {
    // monthly from 2023-01-15: index 12 falls on 2024-01-15
    expect(instalmentsInMonth(monthly, 12, '2024-01-03')).toEqual({
      due: 1,
      paid: 0,
      dueAmount: 2000,
      paidAmount: 0,
    });
    expect(instalmentsInMonth(monthly, 13, '2024-01-31')).toEqual({
      due: 1,
      paid: 1,
      dueAmount: 2000,
      paidAmount: 2000,
    });
  });

  test('yearly policy only counts in its anniversary month', () => {
    expect(instalmentsInMonth(yearly, 4, '2024-04-01').due).toBe(1);
    expect(instalmentsInMonth(yearly, 4, '2024-05-01').due).toBe(0);
  });

  test('nothing is due after the premium paying term ends', () => {
    // monthly paying term is 10 years: last instalment 2032-12-15
    expect(instalmentsInMonth(monthly, 0, '2032-12-01').due).toBe(1);
    expect(instalmentsInMonth(monthly, 0, '2033-01-01').due).toBe(0);
  });
});
