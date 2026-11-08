import { BackupParseError, buildBackup, meetingsToCSV, parseBackup, serializeBackup, toCSV } from './serialize';
import type { Meeting } from '../domain/meetings';
import type { Client, Payment, Policy } from '../domain/types';

const client: Client = {
  id: 1,
  name: 'Asha, Kumar',
  phone: '9876543210',
  address: '12 MG Road',
  dob: '1985-06-01',
  nomineeName: 'Ravi',
  nomineeRelation: 'Son',
  notes: null,
  createdAt: 't',
  updatedAt: 't',
};

const policy: Policy = {
  id: 1,
  clientId: 1,
  policyNumber: 'P123',
  planName: 'Jeevan Anand',
  planNumber: '815',
  sumAssured: 500000,
  commencementDate: '2020-04-10',
  policyTermYears: 20,
  premiumPayingTermYears: 20,
  premiumAmount: 25000,
  premiumMode: 'yearly',
  commissionRate: 5,
  premiumsPaidUpTo: null,
  notes: null,
  createdAt: 't',
  updatedAt: 't',
};

const payment: Payment = {
  id: 1,
  policyId: 1,
  amount: 25000,
  paidDate: '2020-04-10',
  dueDate: '2020-04-10',
  receiptNumber: 'R1',
  lateFee: 0,
  notes: null,
  createdAt: 't',
};

describe('backup round-trip', () => {
  test('serialize then parse preserves records', () => {
    const backup = buildBackup([client], [policy], [payment]);
    const json = serializeBackup(backup);
    const parsed = parseBackup(json);
    expect(parsed.clients).toHaveLength(1);
    expect(parsed.policies[0].policyNumber).toBe('P123');
    expect(parsed.payments[0].amount).toBe(25000);
    expect(parsed.version).toBe(2);
  });

  test('parse rejects invalid JSON', () => {
    expect(() => parseBackup('{not json')).toThrow(BackupParseError);
  });

  test('parse rejects missing arrays', () => {
    expect(() => parseBackup('{"clients":[]}')).toThrow(BackupParseError);
  });
});

describe('toCSV', () => {
  test('escapes commas, quotes and newlines', () => {
    const csv = toCSV(['a', 'b'], [['Asha, Kumar', 'line1\nline2'], ['say "hi"', 5]]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('a,b');
    expect(lines[1]).toBe('"Asha, Kumar","line1');
    expect(csv).toContain('"say ""hi""",5');
  });
});

const meeting: Meeting = {
  id: 7,
  clientId: 1,
  prospectName: null,
  prospectPhone: null,
  policyId: 1,
  date: '2026-11-12',
  time: '16:30',
  place: 'Client home',
  purpose: 'premium_collection',
  notes: null,
  reminderMinutes: 60,
  done: 0,
  outcome: null,
  completedAt: null,
  createdAt: 't',
  updatedAt: 't',
};

describe('meetings in backups', () => {
  test('meetings survive a backup round-trip', () => {
    const parsed = parseBackup(serializeBackup(buildBackup([client], [policy], [payment], [meeting])));
    expect(parsed.meetings).toEqual([meeting]);
  });

  test('a version-1 backup without meetings restores with none', () => {
    const v1 = JSON.stringify({ version: 1, clients: [client], policies: [policy], payments: [payment] });
    expect(parseBackup(v1).meetings).toEqual([]);
  });

  test('a meetings field that is not a list is rejected', () => {
    const bad = JSON.stringify({ clients: [], policies: [], payments: [], meetings: 'x' });
    expect(() => parseBackup(bad)).toThrow(BackupParseError);
  });
});

describe('meetingsToCSV', () => {
  test('lists meetings soonest first with readable purpose, time and status', () => {
    const later = { ...meeting, personName: 'Asha, Kumar', personPhone: '9876543210', policyNumber: 'P123' };
    const prospect = {
      ...meeting,
      id: 8,
      clientId: null,
      policyId: null,
      date: '2026-11-10',
      time: '09:05',
      purpose: 'new_policy' as const,
      place: null,
      done: 1,
      outcome: 'Interested',
      personName: 'Ravi',
      personPhone: null,
      policyNumber: null,
    };
    const lines = meetingsToCSV([later, prospect]).split('\n');
    expect(lines[0]).toBe(
      'Date,Time,With,Phone,Client or Prospect,Policy Number,Purpose,Place,Status,Outcome,Notes',
    );
    expect(lines[1]).toBe('2026-11-10,9:05 am,Ravi,,Prospect,,New policy pitch,,Done,Interested,');
    expect(lines[2]).toBe(
      '2026-11-12,4:30 pm,"Asha, Kumar",9876543210,Client,P123,Premium collection,Client home,Open,,',
    );
  });
});
