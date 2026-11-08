import type { ISODate } from './date';

/** Premium payment frequency. */
export type PremiumMode = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';

export const PREMIUM_MODES: PremiumMode[] = ['monthly', 'quarterly', 'half-yearly', 'yearly'];

/** Number of premium instalments per policy year for each mode. */
export const PAYMENTS_PER_YEAR: Record<PremiumMode, number> = {
  monthly: 12,
  quarterly: 4,
  'half-yearly': 2,
  yearly: 1,
};

/** Months between consecutive due dates for each mode. */
export const MODE_INTERVAL_MONTHS: Record<PremiumMode, number> = {
  monthly: 1,
  quarterly: 3,
  'half-yearly': 6,
  yearly: 12,
};

/**
 * LIC grace period rules: 15 days when premiums are paid monthly, 30 days for
 * every other mode. A policy lapses if the premium is not paid before the
 * grace period ends.
 */
export const GRACE_DAYS: Record<PremiumMode, number> = {
  monthly: 15,
  quarterly: 30,
  'half-yearly': 30,
  yearly: 30,
};

export interface Client {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  dob: ISODate | null;
  nomineeName: string | null;
  nomineeRelation: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NewClient = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;

export interface Policy {
  id: number;
  clientId: number;
  policyNumber: string;
  planName: string | null;
  planNumber: string | null;
  sumAssured: number;
  commencementDate: ISODate;
  policyTermYears: number;
  premiumPayingTermYears: number;
  premiumAmount: number;
  premiumMode: PremiumMode;
  /** Agent commission percentage applied to each premium (0-100). */
  commissionRate: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NewPolicy = Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>;

export interface Payment {
  id: number;
  policyId: number;
  amount: number;
  paidDate: ISODate;
  /** The scheduled due date this payment settles. */
  dueDate: ISODate | null;
  receiptNumber: string | null;
  lateFee: number;
  notes: string | null;
  createdAt: string;
}

export type NewPayment = Omit<Payment, 'id' | 'createdAt'>;

/** Derived lifecycle state of a policy at a reference date. */
export type PolicyStatus =
  | 'active' // premiums current, nothing due yet
  | 'due_soon' // a premium falls due within the reminder window
  | 'overdue' // past the due date but still within the grace period
  | 'lapsed' // grace period elapsed without payment
  | 'fully_paid' // premium paying term complete, policy still in force
  | 'matured'; // policy term complete

export interface PolicyStatusSummary {
  totalPremiums: number;
  paidCount: number;
  maturityDate: ISODate;
  /** Earliest unpaid scheduled due date, or null when fully paid/matured. */
  nextDueDate: ISODate | null;
  /** End of the grace period for nextDueDate, or null when not applicable. */
  graceEndDate: ISODate | null;
  /** Count of due dates that have passed unpaid as of the reference date. */
  overdueCount: number;
  /** Total rupees overdue (unpaid premiums whose due date has passed). */
  overdueAmount: number;
  status: PolicyStatus;
}
