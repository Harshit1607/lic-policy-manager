import type { Meeting } from '../domain/meetings';
import { meetingStart, purposeLabel, timeLabel } from '../domain/meetings';
import type { Client, Payment, Policy } from '../domain/types';

/** 2 added meetings; version-1 backups (no meetings) still restore. */
export const BACKUP_VERSION = 2;

export interface BackupData {
  version: number;
  exportedAt: string;
  clients: Client[];
  policies: Policy[];
  payments: Payment[];
  meetings: Meeting[];
}

export function buildBackup(
  clients: Client[],
  policies: Policy[],
  payments: Payment[],
  meetings: Meeting[] = [],
): BackupData {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    clients,
    policies,
    payments,
    meetings,
  };
}

export function serializeBackup(data: BackupData): string {
  return JSON.stringify(data, null, 2);
}

export class BackupParseError extends Error {}

/** Parse and validate a JSON backup string. Throws BackupParseError on bad input. */
export function parseBackup(raw: string): BackupData {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    throw new BackupParseError('File is not valid JSON.');
  }
  if (!obj || typeof obj !== 'object') {
    throw new BackupParseError('Backup is not an object.');
  }
  const data = obj as Partial<BackupData>;
  if (!Array.isArray(data.clients) || !Array.isArray(data.policies) || !Array.isArray(data.payments)) {
    throw new BackupParseError('Backup is missing clients, policies or payments.');
  }
  if (data.meetings !== undefined && !Array.isArray(data.meetings)) {
    throw new BackupParseError('Backup meetings are not a list.');
  }
  return {
    version: typeof data.version === 'number' ? data.version : BACKUP_VERSION,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : new Date().toISOString(),
    clients: data.clients as Client[],
    policies: data.policies as Policy[],
    payments: data.payments as Payment[],
    // Backups made before meetings existed have none.
    meetings: (data.meetings ?? []) as Meeting[],
  };
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCSV(headers: string[], rows: (unknown[])[]): string {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvCell).join(','));
  }
  return lines.join('\n');
}

/** A flat CSV joining policies with client and premium status fields. */
export function policiesToCSV(
  rows: {
    clientName: string;
    phone: string | null;
    policyNumber: string;
    planName: string | null;
    sumAssured: number;
    premiumAmount: number;
    premiumMode: string;
    commencementDate: string;
    maturityDate: string;
    nextDueDate: string | null;
    status: string;
    overdueAmount: number;
    paidCount: number;
    totalPremiums: number;
  }[],
): string {
  const headers = [
    'Client',
    'Phone',
    'Policy Number',
    'Plan',
    'Sum Assured',
    'Premium',
    'Mode',
    'Commencement',
    'Maturity',
    'Next Due',
    'Status',
    'Overdue Amount',
    'Paid',
    'Total Premiums',
  ];
  return toCSV(
    headers,
    rows.map((r) => [
      r.clientName,
      r.phone,
      r.policyNumber,
      r.planName,
      r.sumAssured,
      r.premiumAmount,
      r.premiumMode,
      r.commencementDate,
      r.maturityDate,
      r.nextDueDate ?? '',
      r.status,
      r.overdueAmount,
      r.paidCount,
      r.totalPremiums,
    ]),
  );
}

/** A CSV of meetings, soonest first, with who, when, purpose and outcome. */
export function meetingsToCSV(
  rows: (Pick<
    Meeting,
    'date' | 'time' | 'purpose' | 'place' | 'reminderMinutes' | 'done' | 'outcome' | 'notes' | 'clientId'
  > & { personName: string | null; personPhone: string | null; policyNumber: string | null })[],
): string {
  const headers = [
    'Date',
    'Time',
    'With',
    'Phone',
    'Client or Prospect',
    'Policy Number',
    'Purpose',
    'Place',
    'Status',
    'Outcome',
    'Notes',
  ];
  const sorted = [...rows].sort(
    (a, b) => (meetingStart(a)?.getTime() ?? 0) - (meetingStart(b)?.getTime() ?? 0),
  );
  return toCSV(
    headers,
    sorted.map((m) => [
      m.date,
      timeLabel(m.time),
      m.personName,
      m.personPhone,
      m.clientId ? 'Client' : 'Prospect',
      m.policyNumber,
      purposeLabel(m.purpose),
      m.place,
      m.done ? 'Done' : 'Open',
      m.outcome,
      m.notes,
    ]),
  );
}
