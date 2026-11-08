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

/**
 * Reschedule local reminders for upcoming premium dues. Cancels all previously
 * scheduled reminders and schedules one notification a few days before each
 * upcoming due date (and on the due date itself). Local only; no network.
 */
export async function rescheduleDueReminders(
  items: PolicyWithStatus[],
  daysBefore = 3,
): Promise<number> {
  const granted = await ensureNotificationSetup();
  if (!granted) return 0;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = Date.now();
  let scheduled = 0;

  for (const item of items) {
    const due = item.summary.nextDueDate;
    if (!due) continue;
    const dueMs = isoToUTC(due).getTime();
    // Fire at 9am local a few days before the due date.
    const triggers = [daysBefore, 0].map((d) => dueMs - d * 86_400_000);
    for (const t of triggers) {
      if (t <= now) continue;
      const fireDate = new Date(t);
      fireDate.setHours(9, 0, 0, 0);
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

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
