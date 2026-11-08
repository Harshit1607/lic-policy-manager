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
  premiumsPaidUpTo TEXT,
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

/**
 * Versioned migrations for installs created before a table existed. Each entry
 * upgrades the schema from version `index` to `index + 1`; the current version
 * is kept in SQLite's `user_version`.
 */
const MIGRATIONS: string[] = [
  // 0 -> 1: meetings and meeting reminders.
  `
  CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY NOT NULL,
    clientId INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    prospectName TEXT,
    prospectPhone TEXT,
    policyId INTEGER REFERENCES policies(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    place TEXT,
    purpose TEXT NOT NULL DEFAULT 'other',
    notes TEXT,
    reminderMinutes INTEGER NOT NULL DEFAULT 60,
    done INTEGER NOT NULL DEFAULT 0,
    outcome TEXT,
    completedAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_meetings_clientId ON meetings(clientId);
  CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date, time);
  `,
];

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    const next = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}

/** Open (once) and migrate the database. */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(SCHEMA);
      const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(policies)');
      if (!cols.some((c) => c.name === 'premiumsPaidUpTo')) {
        await db.execAsync('ALTER TABLE policies ADD COLUMN premiumsPaidUpTo TEXT');
      }
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

/** Current time as an ISO-8601 timestamp. */
export function nowISO(): string {
  return new Date().toISOString();
}
