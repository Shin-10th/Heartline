// Streak rollover logic. See spec section 5.4.
// The nightly rollover itself runs as a scheduled Cloud Function
// (functions/src/index.ts); this module holds the pure logic so it's
// testable independent of Firestore (see __tests__/streaks.test.ts).

// The calendar-day key (YYYY-MM-DD) for a given instant in a given IANA
// timezone -- used as the completions/{date} doc id. Every ritual uses its
// *creator's* timezone as the canonical day boundary so a streak doesn't
// flicker just because the two partners are on different clocks.
export function dayKeyInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    date
  );
}

// A completed day continues the streak; a missed day resets it to zero --
// quietly, with no penalty beyond the reset (spec: "not guilt-inducing").
export function nextStreakCount(currentStreak: number, completedToday: boolean): number {
  return completedToday ? currentStreak + 1 : 0;
}

export type RolloverResult = { streakCount: number; changed: boolean };

// Nightly rollover for one ritual: given its last-completed day key and
// today's/yesterday's keys (all in the ritual's canonical timezone), decide
// whether the streak continues untouched, or resets because a full day was
// skipped. Called once per ritual per night by the scheduled Cloud Function.
export function rolloverStreak(
  currentStreak: number,
  lastCompletedDayKey: string | null,
  todayKey: string,
  yesterdayKey: string
): RolloverResult {
  if (lastCompletedDayKey === todayKey || lastCompletedDayKey === yesterdayKey) {
    // Completed today, or completed yesterday and today hasn't ended yet --
    // nothing to roll over.
    return { streakCount: currentStreak, changed: false };
  }
  return { streakCount: 0, changed: currentStreak !== 0 };
}
