// Sample data shown whenever there's no live paired partner yet -- no
// Firebase project configured, or not signed in / paired. Every screen falls
// back to this so the whole app is browsable before the backend is wired up,
// and swaps automatically to real Firestore data once services/firebase.ts
// is configured and a pairing exists (see hooks/usePartner.ts).

import type { AwakeWindow } from "../services/goldenHour";

export const DEMO_YOU = {
  name: "Aki",
  city: "London",
  timezone: "Europe/London",
  awake: { startHour: 7, endHour: 23 } as AwakeWindow,
  homeLatLng: { lat: 51.5072, lng: -0.1276 },
};

export const DEMO_PARTNER = {
  name: "Jordan",
  city: "Vancouver",
  timezone: "America/Vancouver",
  awake: { startHour: 7, endHour: 23 } as AwakeWindow,
  homeLatLng: { lat: 49.2827, lng: -123.1207 },
};

const today = new Date();
export const DEMO_NEXT_TRIP = {
  date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 27),
  location: DEMO_PARTNER.city,
};

export const DEMO_STREAK_DAYS = 47;

export type DemoRitual = {
  id: string;
  type: "goodMorning" | "goodNight" | "dateNight" | "dailyPhoto" | "custom";
  label: string;
  cadenceLabel: string;
  streakCount: number;
  completedToday: boolean;
};

export const DEMO_RITUALS: DemoRitual[] = [
  { id: "good-morning", type: "goodMorning", label: "Good morning ping", cadenceLabel: "Every day", streakCount: 47, completedToday: true },
  { id: "good-night", type: "goodNight", label: "Goodnight message", cadenceLabel: "Every day", streakCount: 31, completedToday: false },
  { id: "date-night", type: "dateNight", label: "Date night", cadenceLabel: "Every Friday", streakCount: 6, completedToday: false },
];

export type DemoVoiceNote = {
  id: string;
  senderName: "you" | string;
  durationSec: number;
  createdLabel: string;
  isNotificationSound: boolean;
};

export const DEMO_VOICE_NOTES: DemoVoiceNote[] = [
  { id: "vn-1", senderName: DEMO_PARTNER.name, durationSec: 8, createdLabel: "Yesterday", isNotificationSound: true },
  { id: "vn-2", senderName: "you", durationSec: 14, createdLabel: "3 days ago", isNotificationSound: false },
];

export const WORLD_DECOR_THRESHOLDS = [
  { id: "fairy-lights", label: "Fairy lights", streakDays: 7 },
  { id: "rug", label: "Cozy rug", streakDays: 14 },
  { id: "bookshelf", label: "Bookshelf", streakDays: 30 },
  { id: "star-jar", label: "Star jar", streakDays: 45 },
];
