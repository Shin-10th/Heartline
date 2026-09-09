// Great-circle distance + light date/time helpers. Pure functions, no
// dependencies -- used by the Home screen's distance card (spec section 5.6)
// and unit tested independently of Firebase (see __tests__/geo.test.ts).

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Haversine formula -- straight-line ("as the crow flies") distance in miles.
export function haversineMiles(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  return EARTH_RADIUS_MILES * c;
}

// Whole calendar-day difference between "now" and a target date, so a
// countdown reads the same all day rather than ticking over mid-afternoon.
export function daysUntil(targetDate: Date, now: Date = new Date()): number {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfTarget.getTime() - startOfToday.getTime()) / msPerDay);
}

// e.g. "Nov 4", optionally in a specific IANA timezone.
export function formatShortDate(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone }).format(date);
}

// e.g. "9:14 PM", optionally in a specific IANA timezone.
export function formatLocalTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }).format(date);
}
