import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  getReminders,
  getRemindersMasterEnabled,
  setReminderNotificationId,
} from '../db/reminders';
import { parseHHMM } from '../utils/dates';

const CHANNEL_ID = 'water-reminders';

/** Call once at app start, before any notification is scheduled or received. */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Water reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function isPermissionGranted(): Promise<boolean> {
  const status = await Notifications.getPermissionsAsync();
  return status.granted;
}

export async function requestPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function scheduleDailyNotification(time: string): Promise<string> {
  const { hour, minute } = parseHHMM(time);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to hydrate 💧',
      body: 'Drink some water to stay on track with your daily goal.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

/**
 * Bring the OS notification schedule in line with the reminders table.
 * Cancels everything and re-schedules enabled reminders when the master
 * switch is on and permission is granted. Cheap (a handful of reminders)
 * and idempotent, so it is called after every reminders mutation and at
 * app start.
 */
export async function rescheduleAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const reminders = getReminders();
  for (const r of reminders) {
    if (r.notificationId) setReminderNotificationId(r.id, null);
  }
  if (!getRemindersMasterEnabled()) return;
  if (!(await isPermissionGranted())) return;
  for (const r of reminders) {
    if (!r.enabled) continue;
    const notificationId = await scheduleDailyNotification(r.time);
    setReminderNotificationId(r.id, notificationId);
  }
}
