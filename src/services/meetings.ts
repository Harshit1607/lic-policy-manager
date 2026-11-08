import { listMeetings } from '../db/meetings';
import { syncMeetingReminders } from './notifications';

/**
 * Re-read every meeting and resync its local reminder. Best effort: a missing
 * notification permission or platform error never blocks the data change.
 */
export async function refreshMeetingReminders(): Promise<number> {
  try {
    return await syncMeetingReminders(await listMeetings());
  } catch {
    return 0;
  }
}
