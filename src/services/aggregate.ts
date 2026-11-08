import { diffDays, ISODate, todayISO } from '../domain/date';
import { computePolicyStatus, instalmentsInMonth, MonthInstalments } from '../domain/premium';
import type { PolicyStatusSummary } from '../domain/types';
import type { PolicyWithMeta } from '../db/policies';

export interface PolicyWithStatus {
  policy: PolicyWithMeta;
  summary: PolicyStatusSummary;
  /** Days until next due (negative when overdue). Null when nothing is due. */
  daysToDue: number | null;
}

export interface DashboardBuckets {
  overdue: PolicyWithStatus[];
  dueThisWeek: PolicyWithStatus[];
  dueThisMonth: PolicyWithStatus[];
  totalOverdueAmount: number;
}

export function withStatus(policy: PolicyWithMeta, referenceDate: ISODate = todayISO()): PolicyWithStatus {
  const summary = computePolicyStatus(policy, policy.paidCount, referenceDate);
  const daysToDue = summary.nextDueDate ? diffDays(summary.nextDueDate, referenceDate) : null;
  return { policy, summary, daysToDue };
}

/**
 * Sort policies into dashboard buckets: overdue (incl. lapsed), due within 7
 * days, and due within 30 days. A policy appears in exactly one bucket.
 */
export function buildDashboard(
  policies: PolicyWithMeta[],
  referenceDate: ISODate = todayISO(),
): DashboardBuckets {
  const overdue: PolicyWithStatus[] = [];
  const dueThisWeek: PolicyWithStatus[] = [];
  const dueThisMonth: PolicyWithStatus[] = [];
  let totalOverdueAmount = 0;

  for (const p of policies) {
    const item = withStatus(p, referenceDate);
    const { status, overdueAmount } = item.summary;
    if (status === 'overdue' || status === 'lapsed') {
      overdue.push(item);
      totalOverdueAmount += overdueAmount;
    } else if (status === 'due_soon' && item.daysToDue !== null) {
      if (item.daysToDue <= 7) dueThisWeek.push(item);
      else dueThisMonth.push(item);
    }
  }

  const byDue = (a: PolicyWithStatus, b: PolicyWithStatus) =>
    (a.daysToDue ?? 0) - (b.daysToDue ?? 0);
  overdue.sort(byDue);
  dueThisWeek.sort(byDue);
  dueThisMonth.sort(byDue);

  return { overdue, dueThisWeek, dueThisMonth, totalOverdueAmount };
}

/**
 * Premium collection for the calendar month containing `referenceDate`: how
 * many instalments across all policies fall due this month and how many of
 * them are already settled.
 */
export function monthlyCollection(
  policies: PolicyWithMeta[],
  referenceDate: ISODate = todayISO(),
): MonthInstalments {
  const totals: MonthInstalments = { due: 0, paid: 0, dueAmount: 0, paidAmount: 0 };
  for (const p of policies) {
    const m = instalmentsInMonth(p, p.paidCount, referenceDate);
    totals.due += m.due;
    totals.paid += m.paid;
    totals.dueAmount += m.dueAmount;
    totals.paidAmount += m.paidAmount;
  }
  return totals;
}
