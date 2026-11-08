import * as SQLite from 'expo-sqlite';

const DB_NAME = 'lic_policy_manager.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Statements that create the schema. Idempotent (IF NOT EXISTS). */
const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  dob TEXT,
  nomineeName TEXT,
  nomineeRelation TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS policies (
  id INTEGER PRIMARY KEY NOT NULL,
  clientId INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  policyNumber TEXT NOT NULL,
  planName TEXT,
  planNumber TEXT,
  sumAssured REAL NOT NULL DEFAULT 0,
  commencementDate TEXT NOT NULL,
  policyTermYears REAL NOT NULL DEFAULT 0,
  premiumPayingTermYears REAL NOT NULL DEFAULT 0,
  premiumAmount REAL NOT NULL DEFAULT 0,
  premiumMode TEXT NOT NULL DEFAULT 'yearly',
  commissionRate REAL NOT NULL DEFAULT 0,
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_policies_clientId ON policies(clientId);
CREATE INDEX IF NOT EXISTS idx_policies_policyNumber ON policies(policyNumber);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY NOT NULL,
  policyId INTEGER NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  amount REAL NOT NULL DEFAULT 0,
  paidDate TEXT NOT NULL,
  dueDate TEXT,
  receiptNumber TEXT,
  lateFee REAL NOT NULL DEFAULT 0,
  notes TEXT,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_policyId ON payments(policyId);
`;

/** Open (once) and migrate the database. */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(SCHEMA);
      return db;
    })();
  }
  return dbPromise;
}

/** For tests/backup restore: wipe all rows (keeps schema). */
export function nowISO(): string {
  return new Date().toISOString();
}
