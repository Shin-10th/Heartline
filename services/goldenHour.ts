// Golden Hour overlap computation. See spec section 5.2.
// Runs as a Cloud Function on pairing / timezone change, but the pure calculation
// is factored out here so it can be unit tested and reused client-side for previews.

export type AwakeWindow = { startHour: number; endHour: number }; // in local hour-of-day, 0-23

export function computeOverlapWindows(
  aTimezone: string,
  aAwake: AwakeWindow,
  bTimezone: string,
  bAwake: AwakeWindow
): { startUtc: string; durationMin: number }[] {
  // TODO: convert both awake windows to UTC for "today" in each timezone,
  // intersect them, and return 2-3 candidate slots.
  return [];
}
