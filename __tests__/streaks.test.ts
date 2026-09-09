import { nextStreakCount, dayKeyInTimezone, rolloverStreak } from "../services/streaks";

describe("nextStreakCount", () => {
  it("increments when completed today", () => {
    expect(nextStreakCount(5, true)).toBe(6);
  });
  it("resets to zero when missed", () => {
    expect(nextStreakCount(5, false)).toBe(0);
  });
});

describe("dayKeyInTimezone", () => {
  it("formats as YYYY-MM-DD", () => {
    const date = new Date(Date.UTC(2026, 10, 4, 3, 0, 0));
    expect(dayKeyInTimezone(date, "UTC")).toBe("2026-11-04");
  });
  it("can differ across timezones for the same instant", () => {
    const date = new Date(Date.UTC(2026, 10, 4, 23, 30, 0));
    expect(dayKeyInTimezone(date, "UTC")).toBe("2026-11-04");
    expect(dayKeyInTimezone(date, "Pacific/Auckland")).toBe("2026-11-05");
  });
});

describe("rolloverStreak", () => {
  it("holds the streak when completed yesterday but not yet today", () => {
    expect(rolloverStreak(5, "2026-11-03", "2026-11-04", "2026-11-03")).toEqual({ streakCount: 5, changed: false });
  });
  it("resets when a full day was skipped", () => {
    expect(rolloverStreak(5, "2026-11-02", "2026-11-04", "2026-11-03")).toEqual({ streakCount: 0, changed: true });
  });
  it("is a no-op if already at zero", () => {
    expect(rolloverStreak(0, null, "2026-11-04", "2026-11-03")).toEqual({ streakCount: 0, changed: false });
  });
});
