import { buildDashboard } from './aggregate';
import type { PolicyWithMeta } from '../db/policies';

function makePolicy(over: Partial<PolicyWithMeta>): PolicyWithMeta {
  return {
    id: 1,
    clientId: 1,
    clientName: 'Test',
    clientPhone: null,
    paidCount: 0,
    policyNumber: 'P1',
    planName: null,
    planNumber: null,
    sumAssured: 100000,
    commencementDate: '2023-01-01',
    policyTermYears: 20,
    premiumPayingTermYears: 20,
    premiumAmount: 10000,
    premiumMode: 'yearly',
    commissionRate: 5,
    notes: null,
    createdAt: 't',
    updatedAt: 't',
    ...over,
  };
}

describe('buildDashboard', () => {
  const today = '2024-01-05';

  test('classifies overdue, this-week and this-month policies', () => {
    const overdue = makePolicy({
      id: 1,
      policyNumber: 'OVER',
      commencementDate: '2023-01-01', // yearly, next due 2024-01-01, paid 1 -> due 2024-01-01 passed
      paidCount: 1,
    });
    const thisWeek = makePolicy({
      id: 2,
      policyNumber: 'WEEK',
      premiumMode: 'monthly',
      commencementDate: '2023-01-10', // monthly, paidCount set so next due ~2024-01-10 (5 days away)
      premiumPayingTermYears: 20,
      paidCount: 12,
    });
    const thisMonth = makePolicy({
      id: 3,
      policyNumber: 'MONTH',
      premiumMode: 'monthly',
      commencementDate: '2023-01-28',
      paidCount: 12, // next due 2024-01-28 (23 days away)
    });

    const buckets = buildDashboard([overdue, thisWeek, thisMonth], today);
    expect(buckets.overdue.map((i) => i.policy.policyNumber)).toContain('OVER');
    expect(buckets.dueThisWeek.map((i) => i.policy.policyNumber)).toContain('WEEK');
    expect(buckets.dueThisMonth.map((i) => i.policy.policyNumber)).toContain('MONTH');
    expect(buckets.totalOverdueAmount).toBe(10000);
  });

  test('a policy appears in exactly one bucket', () => {
    const p = makePolicy({ paidCount: 1, commencementDate: '2023-01-01' });
    const buckets = buildDashboard([p], today);
    const total =
      buckets.overdue.length + buckets.dueThisWeek.length + buckets.dueThisMonth.length;
    expect(total).toBe(1);
  });
});
