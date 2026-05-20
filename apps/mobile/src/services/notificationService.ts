import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function scheduleDailyDiaryReminder(usualOutOfBedTime: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const permission = await Notifications.requestPermissionsAsync();

  if (!permission.granted) {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  const [hours, minutes] = usualOutOfBedTime.split(':').map(Number);
  const reminderHour = (hours + 1) % 24;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'DIÁRIO DO SONO',
      body: 'Bom dia. Que tal preencher seu Diário do Sono de hoje?',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: reminderHour,
      minute: minutes,
    },
  });
}

export async function cancelDailyDiaryReminder(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
}

