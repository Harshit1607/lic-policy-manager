import { getDatabase, nowISO } from './database';
import type { Meeting, NewMeeting } from '../domain/meetings';

/** A meeting joined with who it is with (client or prospect) and the linked policy number. */
export interface MeetingWithMeta extends Meeting {
  /** Client name, or the prospect's typed name. */
  personName: string | null;
  /** Client phone, or the prospect's typed phone. */
  personPhone: string | null;
  policyNumber: string | null;
}

const SELECT_WITH_META = `
  SELECT m.*,
    COALESCE(c.name, m.prospectName) AS personName,
    COALESCE(c.phone, m.prospectPhone) AS personPhone,
    p.policyNumber AS policyNumber
  FROM meetings m
  LEFT JOIN clients c ON c.id = m.clientId
  LEFT JOIN policies p ON p.id = m.policyId
`;

export async function listMeetings(): Promise<MeetingWithMeta[]> {
  const db = await getDatabase();
  return db.getAllAsync<MeetingWithMeta>(`${SELECT_WITH_META} ORDER BY m.date ASC, m.time ASC`);
}

export async function listMeetingsForClient(clientId: number): Promise<MeetingWithMeta[]> {
  const db = await getDatabase();
  return db.getAllAsync<MeetingWithMeta>(
    `${SELECT_WITH_META} WHERE m.clientId = ? ORDER BY m.date ASC, m.time ASC`,
    [clientId],
  );
}

export async function getMeeting(id: number): Promise<MeetingWithMeta | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<MeetingWithMeta>(`${SELECT_WITH_META} WHERE m.id = ?`, [id]);
  return row ?? null;
}

export async function createMeeting(data: NewMeeting): Promise<number> {
  const db = await getDatabase();
  const ts = nowISO();
  const result = await db.runAsync(
    `INSERT INTO meetings
      (clientId, prospectName, prospectPhone, policyId, date, time, place, purpose, notes,
       reminderMinutes, done, outcome, completedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?)`,
    [
      data.clientId,
      data.prospectName,
      data.prospectPhone,
      data.policyId,
      data.date,
      data.time,
      data.place,
      data.purpose,
      data.notes,
      data.reminderMinutes,
      ts,
      ts,
    ],
  );
  return result.lastInsertRowId;
}

export async function updateMeeting(id: number, data: NewMeeting): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE meetings SET clientId = ?, prospectName = ?, prospectPhone = ?, policyId = ?, date = ?,
       time = ?, place = ?, purpose = ?, notes = ?, reminderMinutes = ?, updatedAt = ?
     WHERE id = ?`,
    [
      data.clientId,
      data.prospectName,
      data.prospectPhone,
      data.policyId,
      data.date,
      data.time,
      data.place,
      data.purpose,
      data.notes,
      data.reminderMinutes,
      nowISO(),
      id,
    ],
  );
}

/** Mark a meeting done with an optional outcome note, or reopen it. */
export async function setMeetingDone(id: number, done: boolean, outcome: string | null = null): Promise<void> {
  const db = await getDatabase();
  const ts = nowISO();
  await db.runAsync(
    `UPDATE meetings SET done = ?, outcome = ?, completedAt = ?, updatedAt = ? WHERE id = ?`,
    [done ? 1 : 0, done ? outcome : null, done ? ts : null, ts, id],
  );
}

export async function deleteMeeting(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM meetings WHERE id = ?`, [id]);
}
