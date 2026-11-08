import { isISODate, ISODate } from './date';

/** Why the agent is meeting the client or prospect. */
export type MeetingPurpose = 'new_policy' | 'premium_collection' | 'claim_paperwork' | 'other';

export const MEETING_PURPOSES: { value: MeetingPurpose; label: string }[] = [
  { value: 'new_policy', label: 'New policy pitch' },
  { value: 'premium_collection', label: 'Premium collection' },
  { value: 'claim_paperwork', label: 'Claim / maturity paperwork' },
  { value: 'other', label: 'Other' },
];

/** Reminder lead times in minutes before the meeting. */
export const REMINDER_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'At time' },
  { value: 15, label: '15 min before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export const DEFAULT_REMINDER_MINUTES = 60;

/**
 * A meeting with an existing client (clientId set) or a prospect who is not a
 * client yet (clientId null, prospectName/prospectPhone typed in).
 * `date` + `time` are local wall-clock values ('YYYY-MM-DD', 'HH:MM', 24h).
 */
export interface Meeting {
  id: number;
  clientId: number | null;
  prospectName: string | null;
  prospectPhone: string | null;
  policyId: number | null;
  date: ISODate;
  time: string;
  place: string | null;
  purpose: MeetingPurpose;
  notes: string | null;
  reminderMinutes: number;
  /** 1 when the meeting has been marked done. */
  done: number;
  outcome: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NewMeeting = Omit<Meeting, 'id' | 'done' | 'outcome' | 'completedAt' | 'createdAt' | 'updatedAt'>;

export function purposeLabel(purpose: MeetingPurpose): string {
  return MEETING_PURPOSES.find((p) => p.value === purpose)?.label ?? 'Other';
}

export function reminderLabel(minutes: number): string {
  return REMINDER_OPTIONS.find((o) => o.value === minutes)?.label ?? `${minutes} min before`;
}

/** True for a 24-hour 'HH:MM' time. */
export function isTime(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [h, m] = value.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

/** The meeting's start as a local Date, or null when date/time are invalid. */
export function meetingStart(m: Pick<Meeting, 'date' | 'time'>): Date | null {
  if (!isISODate(m.date) || !isTime(m.time)) return null;
  const [y, mo, d] = m.date.split('-').map(Number);
  const [h, min] = m.time.split(':').map(Number);
  const start = new Date(y, mo - 1, d, h, min, 0, 0);
  // Reject calendar dates that roll over, e.g. 2026-02-30.
  if (start.getFullYear() !== y || start.getMonth() !== mo - 1 || start.getDate() !== d) return null;
  return start;
}

/** When the reminder should fire: the start minus the lead time. */
export function reminderTime(m: Pick<Meeting, 'date' | 'time' | 'reminderMinutes'>): Date | null {
  const start = meetingStart(m);
  if (!start) return null;
  return new Date(start.getTime() - m.reminderMinutes * 60_000);
}

/**
 * The reminder to schedule for a meeting as of `now`, or null when none is
 * needed: done meetings, invalid times and reminders already in the past.
 */
export function pendingReminderTime(
  m: Pick<Meeting, 'date' | 'time' | 'reminderMinutes' | 'done'>,
  now: Date = new Date(),
): Date | null {
  if (m.done) return null;
  const at = reminderTime(m);
  if (!at || at.getTime() <= now.getTime()) return null;
  return at;
}

export interface MeetingGroups<T> {
  /** Not done, starting now or later; soonest first. */
  upcoming: T[];
  /** Not done but the start time has passed; most recent first. */
  past: T[];
  /** Marked done; most recent first. */
  done: T[];
}

function startMs(m: Pick<Meeting, 'date' | 'time'>): number {
  return meetingStart(m)?.getTime() ?? 0;
}

/** Split meetings into upcoming, past (not marked done) and done. */
export function groupMeetings<T extends Pick<Meeting, 'date' | 'time' | 'done'>>(
  meetings: T[],
  now: Date = new Date(),
): MeetingGroups<T> {
  const upcoming: T[] = [];
  const past: T[] = [];
  const done: T[] = [];
  for (const m of meetings) {
    if (m.done) done.push(m);
    else if (startMs(m) >= now.getTime()) upcoming.push(m);
    else past.push(m);
  }
  upcoming.sort((a, b) => startMs(a) - startMs(b));
  past.sort((a, b) => startMs(b) - startMs(a));
  done.sort((a, b) => startMs(b) - startMs(a));
  return { upcoming, past, done };
}

/**
 * Meetings not yet done that start from `now` until the end of the day
 * `days` days after today (days = 0 means today only); soonest first.
 */
export function upcomingWithinDays<T extends Pick<Meeting, 'date' | 'time' | 'done'>>(
  meetings: T[],
  days: number,
  now: Date = new Date(),
): T[] {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days + 1).getTime();
  return groupMeetings(meetings, now).upcoming.filter((m) => startMs(m) < end);
}

/** 12-hour clock label for a 'HH:MM' time, e.g. '4:30 pm'. */
export function timeLabel(time: string): string {
  if (!isTime(time)) return time;
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

/** Short label like 'Today, 4:30 pm' / 'Tomorrow, 10:00 am' / '12 Nov 2026, 9:15 am'. */
export function meetingWhenLabel(m: Pick<Meeting, 'date' | 'time'>, now: Date = new Date()): string {
  const start = meetingStart(m);
  if (!start) return `${m.date} ${m.time}`;
  const dayMs = 86_400_000;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const diff = Math.round((day - today) / dayMs);
  const time = timeLabel(m.time);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let dayLabel: string;
  if (diff === 0) dayLabel = 'Today';
  else if (diff === 1) dayLabel = 'Tomorrow';
  else if (diff === -1) dayLabel = 'Yesterday';
  else dayLabel = `${start.getDate()} ${months[start.getMonth()]} ${start.getFullYear()}`;
  return `${dayLabel}, ${time}`;
}
