import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Local + push notification scheduling.
// Two classes of notifications (see spec section 6):
//  - scheduled/local: Golden Hour reminder, ritual reminders -- computed and
//    scheduled on-device so they still fire correctly even if the phone is
//    briefly offline.
//  - server-triggered/remote: heartbeats, new voice note, streak milestones --
//    fanned out from Cloud Functions via FCM (functions/src/index.ts).
// Every export here fails quietly (returns null) rather than throwing, since
// notification permissions/config can be missing in perfectly normal cases
// (simulator, web preview, permission declined) and none of that should ever
// break the screen that called it.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensurePermission(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

// Schedules a local reminder `leadMinutes` before a Golden Hour slot's UTC
// start. Returns the notification id (pass it to cancelReminder if the slot
// changes) or null if it couldn't be scheduled.
export async function scheduleGoldenHourReminder(startUtc: string, leadMinutes: number): Promise<string | null> {
  try {
    const granted = await ensurePermission();
    if (!granted) return null;
    const fireAt = new Date(new Date(startUtc).getTime() - leadMinutes * 60000);
    if (fireAt.getTime() <= Date.now()) return null;
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: `Golden Hour in ${leadMinutes} minutes`,
        body: "Your overlap window is coming up — say hi ♥",
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
    });
  } catch {
    return null;
  }
}

// Schedules a recurring daily local reminder for a ritual (e.g. good
// morning/goodnight). Returns the notification id or null.
export async function scheduleRitualReminder(label: string, hour: number, minute: number): Promise<string | null> {
  try {
    const granted = await ensurePermission();
    if (!granted) return null;
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: label,
        body: "A little nudge to keep the streak going ♥",
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  } catch {
    return null;
  }
}

export async function cancelReminder(notificationId: string | null | undefined) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already fired, or never scheduled -- nothing to do.
  }
}

// Registers this device for remote (server-triggered) push and returns the
// Expo push token to save on users/{userId}.pushToken. Requires a physical
// device and a configured EAS projectId in app.json -- returns null on a
// simulator or before that's set up, rather than throwing.
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;
    const granted = await ensurePermission();
    if (!granted) return null;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}
