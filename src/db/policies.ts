import { getDatabase, nowISO } from './database';
import type { NewPolicy, Policy } from '../domain/types';

/** A policy row joined with its client name/phone and settled-premium count. */
export interface PolicyWithMeta extends Policy {
  clientName: string;
  clientPhone: string | null;
  paidCount: number;
}

const SELECT_WITH_META = `
  SELECT p.*, c.name AS clientName, c.phone AS clientPhone,
    (SELECT COUNT(*) FROM payments pm WHERE pm.policyId = p.id) AS paidCount
  FROM policies p
  JOIN clients c ON c.id = p.clientId
`;

export async function listPolicies(search?: string): Promise<PolicyWithMeta[]> {
  const db = await getDatabase();
  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    return db.getAllAsync<PolicyWithMeta>(
      `${SELECT_WITH_META} WHERE p.policyNumber LIKE ? OR c.name LIKE ? OR p.planName LIKE ? ORDER BY p.policyNumber ASC`,
      [q, q, q],
    );
  }
  return db.getAllAsync<PolicyWithMeta>(`${SELECT_WITH_META} ORDER BY p.policyNumber ASC`);
}

export async function listPoliciesForClient(clientId: number): Promise<PolicyWithMeta[]> {
  const db = await getDatabase();
  return db.getAllAsync<PolicyWithMeta>(
    `${SELECT_WITH_META} WHERE p.clientId = ? ORDER BY p.policyNumber ASC`,
    [clientId],
  );
}

export async function getPolicy(id: number): Promise<PolicyWithMeta | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<PolicyWithMeta>(`${SELECT_WITH_META} WHERE p.id = ?`, [id]);
  return row ?? null;
}

export async function createPolicy(data: NewPolicy): Promise<number> {
  const db = await getDatabase();
  const ts = nowISO();
  const result = await db.runAsync(
    `INSERT INTO policies
      (clientId, policyNumber, planName, planNumber, sumAssured, commencementDate,
       policyTermYears, premiumPayingTermYears, premiumAmount, premiumMode, commissionRate, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.clientId,
      data.policyNumber,
      data.planName,
      data.planNumber,
      data.sumAssured,
      data.commencementDate,
      data.policyTermYears,
      data.premiumPayingTermYears,
      data.premiumAmount,
      data.premiumMode,
      data.commissionRate,
      data.notes,
      ts,
      ts,
    ],
  );
  return result.lastInsertRowId;
}

export async function updatePolicy(id: number, data: NewPolicy): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE policies SET
      clientId = ?, policyNumber = ?, planName = ?, planNumber = ?, sumAssured = ?, commencementDate = ?,
      policyTermYears = ?, premiumPayingTermYears = ?, premiumAmount = ?, premiumMode = ?, commissionRate = ?, notes = ?, updatedAt = ?
     WHERE id = ?`,
    [
      data.clientId,
      data.policyNumber,
      data.planName,
      data.planNumber,
      data.sumAssured,
      data.commencementDate,
      data.policyTermYears,
      data.premiumPayingTermYears,
      data.premiumAmount,
      data.premiumMode,
      data.commissionRate,
      data.notes,
      nowISO(),
      id,
    ],
  );
}

export async function deletePolicy(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM policies WHERE id = ?`, [id]);
}
