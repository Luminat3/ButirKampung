import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const CHANNEL_ID = "pengingat-telur";
const REMINDER_KIND = "pengingat-koleksi-telur";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function prepareChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Pengingat koleksi telur",
    description: "Pengingat harian untuk mencatat koleksi telur",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
  });
}

export type ReminderPermission = "granted" | "denied" | "blocked";

export async function ensureReminderPermission(): Promise<ReminderPermission> {
  if (Platform.OS === "web") return "denied";
  await prepareChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return "granted";
  if (!current.canAskAgain) return "blocked";
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: false },
  });
  return requested.granted ? "granted" : "denied";
}

export async function scheduleDailyReminder(time: string) {
  if (Platform.OS === "web") return;
  const [hour, minute] = time.split(":").map(Number);
  await cancelDailyReminder();
  const trigger = Platform.OS === "android"
    ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL_ID }
    : { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, hour, minute, repeats: true };
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Waktunya catat koleksi telur",
      body: "Jangan lupa catat telur yang terkumpul hari ini di TelorKu.",
      data: { kind: REMINDER_KIND },
    },
    trigger: trigger as Notifications.NotificationTriggerInput,
  });
}

export async function cancelDailyReminder() {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.content.data?.kind === REMINDER_KIND)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}
