import { getDatabase, nowISO } from './database';
import type { Client, NewClient } from '../domain/types';

export async function listClients(search?: string): Promise<Client[]> {
  const db = await getDatabase();
  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    return db.getAllAsync<Client>(
      `SELECT * FROM clients WHERE name LIKE ? OR phone LIKE ? ORDER BY name COLLATE NOCASE ASC`,
      [q, q],
    );
  }
  return db.getAllAsync<Client>(`SELECT * FROM clients ORDER BY name COLLATE NOCASE ASC`);
}

export async function getClient(id: number): Promise<Client | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Client>(`SELECT * FROM clients WHERE id = ?`, [id]);
  return row ?? null;
}

export async function createClient(data: NewClient): Promise<number> {
  const db = await getDatabase();
  const ts = nowISO();
  const result = await db.runAsync(
    `INSERT INTO clients (name, phone, address, dob, nomineeName, nomineeRelation, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.phone,
      data.address,
      data.dob,
      data.nomineeName,
      data.nomineeRelation,
      data.notes,
      ts,
      ts,
    ],
  );
  return result.lastInsertRowId;
}

export async function updateClient(id: number, data: NewClient): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE clients SET name = ?, phone = ?, address = ?, dob = ?, nomineeName = ?, nomineeRelation = ?, notes = ?, updatedAt = ?
     WHERE id = ?`,
    [
      data.name,
      data.phone,
      data.address,
      data.dob,
      data.nomineeName,
      data.nomineeRelation,
      data.notes,
      nowISO(),
      id,
    ],
  );
}

export async function deleteClient(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM clients WHERE id = ?`, [id]);
}
