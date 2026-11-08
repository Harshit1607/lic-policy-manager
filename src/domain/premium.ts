import { addDays, addMonths, addYears, compareISO, ISODate, todayISO } from './date';
import {
  GRACE_DAYS,
  MODE_INTERVAL_MONTHS,
  PAYMENTS_PER_YEAR,
  Payment,
  Policy,
  PolicyStatus,
  PolicyStatusSummary,
  PremiumMode,
} from './types';

/** Fields needed to schedule premiums. A subset of {@link Policy}. */
export interface PremiumSchedulable {
  commencementDate: ISODate;
  policyTermYears: number;
  premiumPayingTermYears: number;
  premiumMode: PremiumMode;
  premiumAmount: number;
}

/** Total number of premium instalments across the premium paying term. */
export function totalPremiums(policy: PremiumSchedulable): number {
  return Math.max(0, Math.round(policy.premiumPayingTermYears * PAYMENTS_PER_YEAR[policy.premiumMode]));
}

/** Maturity date = commencement + policy term (years). */
export function maturityDate(policy: PremiumSchedulable): ISODate {
  return addYears(policy.commencementDate, policy.policyTermYears);
}

/**
 * The due date of the Nth premium (0-indexed). The first premium (index 0) is
 * due on the commencement date; subsequent premiums fall on each mode
 * interval thereafter.
 */
export function dueDateForIndex(policy: PremiumSchedulable, index: number): ISODate {
  const months = MODE_INTERVAL_MONTHS[policy.premiumMode] * index;
  return addMonths(policy.commencementDate, months);
}

/** Grace period end for a given due date, per LIC mode rules. */
export function graceEndForDueDate(dueDate: ISODate, mode: PremiumMode): ISODate {
  return addDays(dueDate, GRACE_DAYS[mode]);
}

/**
 * Count how many scheduled due dates fall on or before `asOf`, capped at the
 * total number of premiums.
 */
export function dueCountAsOf(policy: PremiumSchedulable, asOf: ISODate): number {
  const total = totalPremiums(policy);
  let count = 0;
  for (let i = 0; i < total; i++) {
    if (compareISO(dueDateForIndex(policy, i), asOf) <= 0) {
      count = i + 1;
    } else {
      break;
    }
  }
  return count;
}

/**
 * Derive the full premium status of a policy.
 *
 * Payments are applied against the earliest unpaid scheduled due dates in
 * order, so `paidCount` instalments settle due dates 0..paidCount-1 and the
 * next unpaid due date is index `paidCount`.
 */
export function computePolicyStatus(
  policy: PremiumSchedulable,
  paidCount: number,
  referenceDate: ISODate = todayISO(),
  reminderWindowDays = 30,
): PolicyStatusSummary {
  const total = totalPremiums(policy);
  const matureOn = maturityDate(policy);
  const clampedPaid = Math.max(0, Math.min(paidCount, total));

  const reached = dueCountAsOf(policy, referenceDate);
  const overdueCount = Math.max(0, reached - clampedPaid);
  const overdueAmount = overdueCount * policy.premiumAmount;

  const fullyPaid = clampedPaid >= total;
  const nextDueDate = fullyPaid ? null : dueDateForIndex(policy, clampedPaid);
  const graceEndDate = nextDueDate ? graceEndForDueDate(nextDueDate, policy.premiumMode) : null;

  let status: PolicyStatus;
  if (compareISO(referenceDate, matureOn) >= 0) {
    status = 'matured';
  } else if (fullyPaid) {
    status = 'fully_paid';
  } else if (nextDueDate && compareISO(referenceDate, nextDueDate) > 0) {
    // Past the next due date: in grace or lapsed.
    if (graceEndDate && compareISO(referenceDate, graceEndDate) > 0) {
      status = 'lapsed';
    } else {
      status = 'overdue';
    }
  } else if (nextDueDate && compareISO(addDays(referenceDate, reminderWindowDays), nextDueDate) >= 0) {
    status = 'due_soon';
  } else {
    status = 'active';
  }

  return {
    totalPremiums: total,
    paidCount: clampedPaid,
    maturityDate: matureOn,
    nextDueDate,
    graceEndDate,
    overdueCount,
    overdueAmount,
    status,
  };
}

/** Instalments of one policy that fall due in a calendar month, and how many are settled. */
export interface MonthInstalments {
  due: number;
  paid: number;
  dueAmount: number;
  paidAmount: number;
}

/**
 * Count the scheduled instalments whose due date falls in the calendar month
 * containing `referenceDate`, and how many of those are settled. Settlement
 * follows {@link computePolicyStatus}: instalment `i` is settled when
 * `i < paidCount`.
 */
export function instalmentsInMonth(
  policy: PremiumSchedulable,
  paidCount: number,
  referenceDate: ISODate = todayISO(),
): MonthInstalments {
  const monthKey = referenceDate.slice(0, 7);
  const total = totalPremiums(policy);
  let due = 0;
  let paid = 0;
  for (let i = 0; i < total; i++) {
    const key = dueDateForIndex(policy, i).slice(0, 7);
    if (key > monthKey) break;
    if (key === monthKey) {
      due += 1;
      if (i < paidCount) paid += 1;
    }
  }
  return {
    due,
    paid,
    dueAmount: due * policy.premiumAmount,
    paidAmount: paid * policy.premiumAmount,
  };
}

/** Number of settled instalments implied by a payment list. */
export function paidCountFromPayments(payments: Pick<Payment, 'id'>[]): number {
  return payments.length;
}

/** Commission earned on a single premium amount for a policy. */
export function commissionForAmount(policy: Pick<Policy, 'commissionRate'>, amount: number): number {
  return Math.round(amount * (policy.commissionRate / 100) * 100) / 100;
}

/** Total commission earned across a set of payments for a policy. */
export function totalCommission(
  policy: Pick<Policy, 'commissionRate'>,
  payments: Pick<Payment, 'amount'>[],
): number {
  const sum = payments.reduce((acc, p) => acc + commissionForAmount(policy, p.amount), 0);
  return Math.round(sum * 100) / 100;
}

const STATUS_LABELS: Record<PolicyStatus, string> = {
  active: 'Active',
  due_soon: 'Due soon',
  overdue: 'Overdue',
  lapsed: 'Lapsed',
  fully_paid: 'Fully paid',
  matured: 'Matured',
};

export function statusLabel(status: PolicyStatus): string {
  return STATUS_LABELS[status];
}
