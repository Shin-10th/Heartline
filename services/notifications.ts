// Local + push notification scheduling.
// Install first: npx expo install expo-notifications expo-device
//
// Two classes of notifications (see spec section 6):
//  - scheduled/local: Golden Hour reminder, ritual reminders (scheduled on-device)
//  - server-triggered/remote: heartbeats, new voice note, streak milestones (via FCM)

export async function scheduleGoldenHourReminder(startUtc: string, leadMinutes: number) {
  // TODO: Notifications.scheduleNotificationAsync(...) computed from startUtc - leadMinutes
}

export async function registerForPushNotificationsAsync() {
  // TODO: request permission, get Expo push token, save to users/{userId}.pushToken
}
