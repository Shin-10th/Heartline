// Golden Hour overlap computation. See spec section 5.2.
// Runs as a Cloud Function on pairing / timezone change (functions/src/index.ts),
// but the pure calculation lives here so it can be unit tested and reused
// client-side for instant previews before the write round-trips.

export type AwakeWindow = { startHour: number; endHour: number }; // local hour-of-day, 0-23
export type OverlapSlot = { startUtc: string; durationMin: number };

// Returns a timezone's offset from UTC, in minutes, for the instant `date`
// (localTime = UTC + offset). Uses Intl rather than a date library, since
// that's all a Cloud Function / RN runtime needs for this.
function getTimezoneOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUtc - date.getTime()) / 60000;
}

function localDatePartsInZone(timeZone: string, date: Date): { year: number; month: number; day: number } {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

// Converts an hour-of-day "today" (in a given IANA timezone) to a UTC instant.
// `hour` may exceed 23 to mean "into tomorrow" (used for wrap-past-midnight windows).
function localHourToUtc(timeZone: string, hour: number, referenceUtc: Date): Date {
  const { year, month, day } = localDatePartsInZone(timeZone, referenceUtc);
  const dayOffsetMs = Math.floor(hour / 24) * 86400000;
  const guessMs = Date.UTC(year, month - 1, day, ((hour % 24) + 24) % 24, 0, 0) + dayOffsetMs;
  const offsetMin = getTimezoneOffsetMinutes(timeZone, new Date(guessMs));
  return new Date(guessMs - offsetMin * 60000);
}

// Computes the overlap between two partners' daily "awake" windows and
// returns up to three candidate UTC slots, longest first. Checks the target
// day plus a day on either side so windows that wrap across the UTC day
// boundary (nearly every long-distance pair) are still found.
export function computeOverlapWindows(
  aTimezone: string,
  aAwake: AwakeWindow,
  bTimezone: string,
  bAwake: AwakeWindow,
  referenceUtc: Date = new Date()
): OverlapSlot[] {
  const bStart = localHourToUtc(bTimezone, bAwake.startHour, referenceUtc);
  const bEnd = localHourToUtc(bTimezone, bAwake.endHour, referenceUtc);

  const dayMs = 86400000;
  const candidates: OverlapSlot[] = [];

  for (const shiftDays of [-1, 0, 1]) {
    const aStart = new Date(localHourToUtc(aTimezone, aAwake.startHour, referenceUtc).getTime() + shiftDays * dayMs);
    const aEnd = new Date(localHourToUtc(aTimezone, aAwake.endHour, referenceUtc).getTime() + shiftDays * dayMs);

    const overlapStartMs = Math.max(aStart.getTime(), bStart.getTime());
    const overlapEndMs = Math.min(aEnd.getTime(), bEnd.getTime());
    const durationMin = Math.round((overlapEndMs - overlapStartMs) / 60000);
    if (durationMin > 0) {
      candidates.push({ startUtc: new Date(overlapStartMs).toISOString(), durationMin });
    }
  }

  const unique = candidates.filter((slot, i) => candidates.findIndex((s) => s.startUtc === slot.startUtc) === i);
  unique.sort((a, b) => b.durationMin - a.durationMin);
  return unique.slice(0, 3);
}

// The instant a reminder notification should fire for a given slot.
export function suggestedReminderTime(slot: OverlapSlot, leadMinutes: number): Date {
  return new Date(new Date(slot.startUtc).getTime() - leadMinutes * 60000);
}
