import { Platform } from 'react-native';
import { t } from './i18n';

// One local notification per week (Sunday 19:00). No server, no push token.
// Loaded lazily: importing expo-notifications throws inside Expo Go on Android (fine in real builds).
const load = () => import('expo-notifications');
const CHANNEL = 'reminders';

export async function enableWeeklyReminder(): Promise<boolean> {
  const Notifications = await load();
  if (Platform.OS === 'android') {
    // Android 13+ shows the permission prompt only once a channel exists.
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: t.reminders,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: t.reminderTitle, body: t.reminderBody },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 19,
      minute: 0,
      channelId: CHANNEL,
    },
  });
  return true;
}

export async function disableWeeklyReminder() {
  const Notifications = await load();
  await Notifications.cancelAllScheduledNotificationsAsync();
}
