import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { isoToUTC } from '../domain/date';
import { formatCurrency, formatDate } from '../domain/format';
import type { PolicyWithStatus } from './aggregate';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = 'premium-dues';

export async function ensureNotificationSetup(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Premium due reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  return granted;
}

/** Only dues this many days ahead get reminders; refreshed on every Dashboard visit. */
const HORIZON_DAYS = 45;
/** Two alarms per policy; keeps well under Android's ~500 alarms-per-app cap. */
const MAX_POLICIES = 100;

let pending: Promise<unknown> = Promise.resolve();

/** Run reminder jobs one at a time so a cancel never interleaves with a schedule. */
function serialized<T>(job: () => Promise<T>): Promise<T> {
  const run = pending.then(job);
  pending = run.catch(() => undefined);
  return run;
}

/**
 * Reschedule local reminders for upcoming premium dues. Cancels all previously
 * scheduled reminders and schedules one notification a few days before each
 * due date within the next {@link HORIZON_DAYS} days (and on the due date
 * itself), soonest first. Local only; no network.
 */
export function rescheduleDueReminders(items: PolicyWithStatus[], daysBefore = 3): Promise<number> {
  return serialized(() => scheduleDueReminders(items, daysBefore));
}

async function scheduleDueReminders(items: PolicyWithStatus[], daysBefore: number): Promise<number> {
  const granted = await ensureNotificationSetup();
  if (!granted) return 0;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = Date.now();
  let scheduled = 0;

  const upcoming = items
    .filter((i) => i.daysToDue !== null && i.daysToDue >= 0 && i.daysToDue <= HORIZON_DAYS)
    .sort((a, b) => a.daysToDue! - b.daysToDue!)
    .slice(0, MAX_POLICIES);

  for (const item of upcoming) {
    const due = item.summary.nextDueDate;
    if (!due) continue;
    const dueUTC = isoToUTC(due);
    // Fire at 9am local time a few days before the due date and on the day.
    for (const d of [daysBefore, 0]) {
      const fireDate = new Date(
        dueUTC.getUTCFullYear(),
        dueUTC.getUTCMonth(),
        dueUTC.getUTCDate() - d,
        9,
      );
      if (fireDate.getTime() <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Premium due: ${item.policy.clientName}`,
          body: `${formatCurrency(item.policy.premiumAmount)} for policy ${item.policy.policyNumber} is due on ${formatDate(due)}.`,
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireDate,
        },
      });
      scheduled += 1;
    }
  }
  return scheduled;
}
