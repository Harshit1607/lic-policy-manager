import { BackupParseError, buildBackup, parseBackup, serializeBackup, toCSV } from './serialize';
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
    expect(parsed.version).toBe(1);
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
