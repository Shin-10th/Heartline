// Streak rollover logic. See spec section 5.4.
// The nightly rollover itself runs as a Cloud Function (functions/src/index.ts);
// this module holds the pure logic so it's testable independent of Firestore.

export function nextStreakCount(currentStreak: number, completedToday: boolean): number {
  return completedToday ? currentStreak + 1 : 0;
}
