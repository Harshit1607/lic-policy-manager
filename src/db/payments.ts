import { getDatabase, nowISO } from './database';
import type { NewPayment, Payment } from '../domain/types';

export async function listPayments(policyId: number): Promise<Payment[]> {
  const db = await getDatabase();
  return db.getAllAsync<Payment>(
    `SELECT * FROM payments WHERE policyId = ? ORDER BY paidDate DESC, id DESC`,
    [policyId],
  );
}

export async function listAllPayments(): Promise<Payment[]> {
  const db = await getDatabase();
  return db.getAllAsync<Payment>(`SELECT * FROM payments ORDER BY paidDate DESC, id DESC`);
}

export async function countPayments(policyId: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM payments WHERE policyId = ?`,
    [policyId],
  );
  return row?.n ?? 0;
}

export async function createPayment(data: NewPayment): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO payments (policyId, amount, paidDate, dueDate, receiptNumber, lateFee, notes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.policyId,
      data.amount,
      data.paidDate,
      data.dueDate,
      data.receiptNumber,
      data.lateFee,
      data.notes,
      nowISO(),
    ],
  );
  return result.lastInsertRowId;
}

export async function deletePayment(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM payments WHERE id = ?`, [id]);
}
