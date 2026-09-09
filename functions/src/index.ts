import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();
const db = admin.firestore();

// ---------------------------------------------------------------------------
// Shared pure logic, mirrored from services/goldenHour.ts and
// services/streaks.ts on the client. Cloud Functions is its own npm package
// (functions/), so these are duplicated rather than imported -- keep the two
// copies in sync by hand if either changes. TODO: move both into a shared
// workspace package once this grows past MVP.
// ---------------------------------------------------------------------------

type AwakeWindow = { startHour: number; endHour: number };
type OverlapSlot = { startUtc: string; durationMin: number };

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
  for (const p of dtf.formatToParts(date)) if (p.type !== "literal") parts[p.type] = p.value;
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

function localDatePartsInZone(timeZone: string, date: Date) {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) if (p.type !== "literal") parts[p.type] = p.value;
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

function localHourToUtc(timeZone: string, hour: number, referenceUtc: Date): Date {
  const { year, month, day } = localDatePartsInZone(timeZone, referenceUtc);
  const dayOffsetMs = Math.floor(hour / 24) * 86400000;
  const guessMs = Date.UTC(year, month - 1, day, ((hour % 24) + 24) % 24, 0, 0) + dayOffsetMs;
  const offsetMin = getTimezoneOffsetMinutes(timeZone, new Date(guessMs));
  return new Date(guessMs - offsetMin * 60000);
}

function computeOverlapWindows(
  aTz: string,
  aAwake: AwakeWindow,
  bTz: string,
  bAwake: AwakeWindow,
  referenceUtc: Date = new Date()
): OverlapSlot[] {
  const bStart = localHourToUtc(bTz, bAwake.startHour, referenceUtc);
  const bEnd = localHourToUtc(bTz, bAwake.endHour, referenceUtc);
  const dayMs = 86400000;
  const candidates: OverlapSlot[] = [];
  for (const shiftDays of [-1, 0, 1]) {
    const aStart = new Date(localHourToUtc(aTz, aAwake.startHour, referenceUtc).getTime() + shiftDays * dayMs);
    const aEnd = new Date(localHourToUtc(aTz, aAwake.endHour, referenceUtc).getTime() + shiftDays * dayMs);
    const overlapStartMs = Math.max(aStart.getTime(), bStart.getTime());
    const overlapEndMs = Math.min(aEnd.getTime(), bEnd.getTime());
    const durationMin = Math.round((overlapEndMs - overlapStartMs) / 60000);
    if (durationMin > 0) candidates.push({ startUtc: new Date(overlapStartMs).toISOString(), durationMin });
  }
  const unique = candidates.filter((s, i) => candidates.findIndex((c) => c.startUtc === s.startUtc) === i);
  unique.sort((a, b) => b.durationMin - a.durationMin);
  return unique.slice(0, 3);
}

function dayKeyInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

const DEFAULT_AWAKE: AwakeWindow = { startHour: 7, endHour: 23 };

// ---------------------------------------------------------------------------
// Golden Hour recompute -- on pairing, or either partner's timezone
// changing, recompute candidate overlap windows for their couple (§5.2).
// ---------------------------------------------------------------------------

async function recomputeGoldenHourForCouple(coupleId: string) {
  const coupleSnap = await db.doc(`couples/${coupleId}`).get();
  const memberIds = (coupleSnap.data()?.memberIds ?? []) as string[];
  if (memberIds.length !== 2) return;

  const [aSnap, bSnap] = await Promise.all(memberIds.map((id) => db.doc(`users/${id}`).get()));
  const aTz = (aSnap.data()?.timezone as string) ?? "UTC";
  const bTz = (bSnap.data()?.timezone as string) ?? "UTC";

  const candidates = computeOverlapWindows(aTz, DEFAULT_AWAKE, bTz, DEFAULT_AWAKE);
  await db
    .doc(`couples/${coupleId}/goldenHour/current`)
    .set({ candidates, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  logger.info(`Recomputed Golden Hour for couple ${coupleId}`, { candidateCount: candidates.length });
}

export const recomputeGoldenHourOnUserChange = onDocumentUpdated("users/{userId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after || before.timezone === after.timezone) return;
  const coupleId = after.coupleId as string | undefined;
  if (coupleId) await recomputeGoldenHourForCouple(coupleId);
});

export const recomputeGoldenHourOnPairing = onDocumentCreated("couples/{coupleId}", async (event) => {
  await recomputeGoldenHourForCouple(event.params.coupleId as string);
});

// ---------------------------------------------------------------------------
// Nightly streak rollover -- for every ritual, resets its streak to zero if
// a full day was skipped, using the ritual creator's timezone as the
// canonical day boundary so a streak never flickers across two clocks (§5.4).
// ---------------------------------------------------------------------------
export const rolloverStreaksNightly = onSchedule("every day 00:05", async () => {
  const ritualsSnap = await db.collectionGroup("rituals").get();
  const now = new Date();
  const batch = db.batch();
  let changedCount = 0;

  for (const ritualDoc of ritualsSnap.docs) {
    const ritual = ritualDoc.data();
    const creatorTz = (ritual.creatorTimezone as string) ?? "UTC";
    const todayKey = dayKeyInTimezone(now, creatorTz);
    const yesterdayKey = dayKeyInTimezone(new Date(now.getTime() - 86400000), creatorTz);
    const lastCompletedDayKey = (ritual.lastCompletedDayKey as string) ?? null;

    const stillCurrent = lastCompletedDayKey === todayKey || lastCompletedDayKey === yesterdayKey;
    if (!stillCurrent && (ritual.streakCount ?? 0) !== 0) {
      batch.update(ritualDoc.ref, { streakCount: 0 });
      changedCount++;
    }
  }

  if (changedCount > 0) await batch.commit();
  logger.info(`Nightly streak rollover: reset ${changedCount} ritual(s).`);
});

// ---------------------------------------------------------------------------
// Notification fan-out -- heartbeats and new voice notes push to the OTHER
// member of the couple (§5.5, §6). Golden Hour reminders and ritual
// reminders are scheduled client-side instead (services/notifications.ts) so
// they still fire correctly if the device is briefly offline.
// ---------------------------------------------------------------------------
async function notifyPartner(coupleId: string, senderId: string, notification: { title: string; body: string }) {
  const coupleSnap = await db.doc(`couples/${coupleId}`).get();
  const memberIds = (coupleSnap.data()?.memberIds ?? []) as string[];
  const partnerId = memberIds.find((id) => id !== senderId);
  if (!partnerId) return;

  const partnerSnap = await db.doc(`users/${partnerId}`).get();
  const pushToken = partnerSnap.data()?.pushToken as string | undefined;
  if (!pushToken) return;

  try {
    await admin.messaging().send({ token: pushToken, notification });
  } catch (err) {
    logger.warn(`Failed to send push to ${partnerId}`, err);
  }
}

export const onHeartbeatSent = onDocumentCreated("couples/{coupleId}/heartbeats/{heartbeatId}", async (event) => {
  const heartbeat = event.data?.data();
  if (!heartbeat) return;
  await notifyPartner(event.params.coupleId as string, heartbeat.senderId as string, {
    title: "💓",
    body: "Someone's thinking of you.",
  });
});

export const onVoiceNoteAdded = onDocumentCreated("couples/{coupleId}/voiceNotes/{noteId}", async (event) => {
  const note = event.data?.data();
  if (!note) return;
  await notifyPartner(event.params.coupleId as string, note.senderId as string, {
    title: "New voice note",
    body: "They left you something to listen to ♥",
  });
});

// ---------------------------------------------------------------------------
// Avatar generation -- TODO: on a photo upload finishing under
// users/{userId}/avatarSource.*, call a hosted image-to-image API (e.g.
// Replicate) to produce a pixel sprite, store it in Cloud Storage, and save
// its URL on users/{userId}.avatarUrl. Needs a provider API key (keep it in
// Secret Manager / functions config, never hardcoded) and is flagged in the
// spec as the highest-uncertainty feature -- worth a short isolated
// prototype before wiring it in here (§5.7, §9). Intentionally left
// unimplemented.
// ---------------------------------------------------------------------------
