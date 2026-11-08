import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { todayISO } from '../domain/date';
import { computePolicyStatus, maturityDate, statusLabel } from '../domain/premium';
import { getDatabase, nowISO } from '../db/database';
import { listClients } from '../db/clients';
import { listPolicies } from '../db/policies';
import { listAllPayments } from '../db/payments';
import { listMeetings } from '../db/meetings';
import {
  buildBackup,
  meetingsToCSV,
  parseBackup,
  policiesToCSV,
  serializeBackup,
} from './serialize';

async function writeAndShare(fileName: string, contents: string, mimeType: string): Promise<string> {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(contents);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: fileName, UTI: 'public.item' });
  }
  return file.uri;
}

/** Export a full JSON backup and open the share sheet. */
export async function exportJsonBackup(): Promise<string> {
  const [clients, policiesMeta, payments, meetingsMeta] = await Promise.all([
    listClients(),
    listPolicies(),
    listAllPayments(),
    listMeetings(),
  ]);
  const policies = policiesMeta.map(({ clientName: _c, clientPhone: _ph, paidCount: _p, ...rest }) => rest);
  const meetings = meetingsMeta.map(
    ({ personName: _n, personPhone: _ph, policyNumber: _pn, ...rest }) => rest,
  );
  const backup = buildBackup(clients, policies, payments, meetings);
  const fileName = `lic-backup-${todayISO()}.json`;
  return writeAndShare(fileName, serializeBackup(backup), 'application/json');
}

/** Export a human-readable CSV of all policies and open the share sheet. */
export async function exportPoliciesCsv(): Promise<string> {
  const policies = await listPolicies();
  const today = todayISO();
  const rows = policies.map((p) => {
    const summary = computePolicyStatus(p, p.paidCount, today);
    return {
      clientName: p.clientName,
      phone: p.clientPhone,
      policyNumber: p.policyNumber,
      planName: p.planName,
      sumAssured: p.sumAssured,
      premiumAmount: p.premiumAmount,
      premiumMode: p.premiumMode,
      commencementDate: p.commencementDate,
      maturityDate: maturityDate(p),
      nextDueDate: summary.nextDueDate,
      status: statusLabel(summary.status),
      overdueAmount: summary.overdueAmount,
      paidCount: summary.paidCount,
      totalPremiums: summary.totalPremiums,
    };
  });
  const fileName = `lic-policies-${today}.csv`;
  return writeAndShare(fileName, policiesToCSV(rows), 'text/csv');
}

/** Export all meetings as CSV and open the share sheet. */
export async function exportMeetingsCsv(): Promise<string> {
  const meetings = await listMeetings();
  return writeAndShare(`lic-meetings-${todayISO()}.csv`, meetingsToCSV(meetings), 'text/csv');
}

export interface RestoreResult {
  clients: number;
  policies: number;
  payments: number;
  meetings: number;
}

/**
 * Let the user pick a JSON backup file and replace all current data with it.
 * Returns null if the user cancels. The wipe and re-insert run in a single
 * transaction, so a failed restore leaves existing data untouched.
 */
export async function importJsonBackup(): Promise<RestoreResult | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets?.length) return null;

  const file = new File(picked.assets[0].uri);
  const raw = await file.text();
  const backup = parseBackup(raw);

  const db = await getDatabase();
  const ts = nowISO();

  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM meetings; DELETE FROM payments; DELETE FROM policies; DELETE FROM clients;');
    for (const c of backup.clients) {
      await db.runAsync(
        `INSERT INTO clients (id, name, phone, address, dob, nomineeName, nomineeRelation, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          c.name,
          c.phone ?? null,
          c.address ?? null,
          c.dob ?? null,
          c.nomineeName ?? null,
          c.nomineeRelation ?? null,
          c.notes ?? null,
          c.createdAt ?? ts,
          c.updatedAt ?? ts,
        ],
      );
    }
    for (const p of backup.policies) {
      await db.runAsync(
        `INSERT INTO policies
          (id, clientId, policyNumber, planName, planNumber, sumAssured, commencementDate,
           policyTermYears, premiumPayingTermYears, premiumAmount, premiumMode, commissionRate, premiumsPaidUpTo, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.clientId,
          p.policyNumber,
          p.planName ?? null,
          p.planNumber ?? null,
          p.sumAssured ?? 0,
          p.commencementDate,
          p.policyTermYears ?? 0,
          p.premiumPayingTermYears ?? 0,
          p.premiumAmount ?? 0,
          p.premiumMode ?? 'yearly',
          p.commissionRate ?? 0,
          p.premiumsPaidUpTo ?? null,
          p.notes ?? null,
          p.createdAt ?? ts,
          p.updatedAt ?? ts,
        ],
      );
    }
    for (const pm of backup.payments) {
      await db.runAsync(
        `INSERT INTO payments (id, policyId, amount, paidDate, dueDate, receiptNumber, lateFee, notes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pm.id,
          pm.policyId,
          pm.amount ?? 0,
          pm.paidDate,
          pm.dueDate ?? null,
          pm.receiptNumber ?? null,
          pm.lateFee ?? 0,
          pm.notes ?? null,
          pm.createdAt ?? ts,
        ],
      );
    }
    for (const m of backup.meetings) {
      await db.runAsync(
        `INSERT INTO meetings
          (id, clientId, prospectName, prospectPhone, policyId, date, time, place, purpose, notes,
           reminderMinutes, done, outcome, completedAt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          m.id,
          m.clientId ?? null,
          m.prospectName ?? null,
          m.prospectPhone ?? null,
          m.policyId ?? null,
          m.date,
          m.time,
          m.place ?? null,
          m.purpose ?? 'other',
          m.notes ?? null,
          m.reminderMinutes ?? 60,
          m.done ? 1 : 0,
          m.outcome ?? null,
          m.completedAt ?? null,
          m.createdAt ?? ts,
          m.updatedAt ?? ts,
        ],
      );
    }
  });

  return {
    clients: backup.clients.length,
    policies: backup.policies.length,
    payments: backup.payments.length,
    meetings: backup.meetings.length,
  };
}
