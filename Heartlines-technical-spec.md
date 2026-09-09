# Heartlines — Technical Specification

*Version 1.0 — derived from `Heartlines-concept.md`. This spec turns the concept into a buildable architecture, data model, and phased scope.*

---

## 1. Product summary

Heartlines is a mobile app for long-distance couples that bundles four things into one shared space: a timezone-aware "Golden Hour" scheduler, voice notes that double as custom notification sounds, low-pressure recurring rituals with streaks, a one-tap "heartbeat" ping, and a shared pixel-art "World" that grows as a couple's streaks grow. Two users, permanently paired 1:1, sharing state in near-real time.

## 2. Tech stack — locked

**Client: React Native + Expo (managed workflow), TypeScript, with React Native Skia for custom rendering.**

One codebase covers iOS and Android, Expo Go lets you test on your own phone in minutes without native build tooling, and its managed modules (`expo-av`/`expo-audio` for voice recording, `expo-notifications` for push, `expo-location`, `expo-secure-store`) cover nearly everything this app needs without ejecting to bare native. It's also the most commonly hired-for stack for consumer social apps at this scale, which matters if you ever bring on outside help. `@shopify/react-native-skia` is added specifically for the World screen and hand-drawn heart animations — it gives the same GPU-accelerated custom-drawing engine Flutter uses, closing the main rendering gap React Native would otherwise have for this app's illustrated, pixel-art look.

**Backend: Firebase** (Auth, Firestore, Cloud Functions, Cloud Storage, Cloud Messaging).

Two paired users sharing live state (Golden Hour slot, streaks, World decor, heartbeats) is exactly Firestore's sweet spot: real-time listeners give you live sync for free, Firebase Auth handles sign-in, Cloud Storage holds voice clips/photos, and Cloud Functions handle scheduled/triggered logic (streak rollovers, notification fan-out) without standing up a server. This is the default professional choice for a solo/small-team consumer MVP that needs to ship fast; a custom Node + Postgres backend is the natural "graduate to" step later if Heartlines grows and needs more complex querying, cost control at scale, or the encryption model below.

**Rejected alternatives:**
- **Flutter (Dart)** — the strongest technical fit for the World screen specifically, but a separate language from the rest of the stack with a smaller hiring pool; React Native Skia closes most of the rendering gap that made Flutter attractive.
- **Native (Swift + Kotlin)** — means building and maintaining the same app twice, permanently, in two different languages. Only justified if true CallKit-based ringtone-swapping (§5.3) becomes a hard requirement — and even then, that one feature can be added as a native module inside the React Native app rather than triggering a full rewrite.

**AI avatar pipeline:** a hosted image-to-image / style-transfer model (e.g. Replicate-hosted or a similar API) called from a Cloud Function — not run on-device. Flagged as a distinct build track in §6.6 and §9, since it's the one piece with real per-call cost and quality risk.

## 3. Architecture overview

```
┌─────────────────────┐        ┌──────────────────────────┐
│  React Native app    │◄──────►│  Firestore (real-time)    │
│  (iOS / Android)     │        │  - couples, users, rituals│
│                      │        │  - streaks, heartbeats     │
│  - Expo Notifications│        │  - golden hour, world state│
│  - expo-av (record)  │        └────────────┬──────────────┘
│  - Local scheduling  │                     │
└──────────┬───────────┘        ┌────────────▼──────────────┐
           │                    │  Cloud Functions            │
           │  uploads           │  - streak rollover (cron)   │
           ▼                    │  - notification fan-out     │
┌──────────────────────┐        │  - avatar generation job    │
│  Cloud Storage        │◄──────┤  - Golden Hour recompute    │
│  - voice clips        │        └────────────┬──────────────┘
│  - photos / avatars   │                     │
└──────────────────────┘        ┌────────────▼──────────────┐
                                 │  FCM → push notifications   │
                                 └──────────────────────────┘
```

## 4. Data model (Firestore collections)

- **`users/{userId}`** — displayName, timezone (IANA string, auto-detected + overridable), pushToken, homeCity {lat, lng, label}, avatarUrl (generated pixel sprite), createdAt.
- **`couples/{coupleId}`** — memberIds: [userIdA, userIdB], pairedAt, inviteCode (single-use, expiring), nextTripDate (nullable), nextTripLocation (nullable).
- **`couples/{coupleId}/goldenHour`** — computed overlap windows, lockedSlot {startUtc, durationMin, status: proposed|locked}, reminderLeadMin (default 10).
- **`couples/{coupleId}/voiceNotes/{noteId}`** — senderId, storageUrl, durationSec, createdAt, setAsNotificationSound: bool.
- **`couples/{coupleId}/rituals/{ritualId}`** — type (goodMorning|goodNight|dateNight|dailyPhoto|custom), cadence (RRULE-style string), createdBy, streakCount, lastCompletedAt, pausedBy: [userId] | [].
- **`couples/{coupleId}/rituals/{ritualId}/completions/{date}`** — completedBy: [userId], timestamp.
- **`couples/{coupleId}/heartbeats/{heartbeatId}`** — senderId, sentAt, acknowledgedAt (nullable).
- **`couples/{coupleId}/world`** — decorUnlocked: [decorId], sharedGifts: [{fromUserId, giftId, sentAt}], milestoneThresholds already claimed.

Security rule baseline: every document under `couples/{coupleId}` is readable/writable only by the two `memberIds` — no third party, including other Heartlines users, can read a couple's data.

## 5. Feature → technical breakdown

### 5.1 Onboarding & pairing
Sign up (email or Sign in with Apple/Google) → app generates a short-lived invite code/deep link → partner opens it and the two `userId`s are written into a new `couples` doc. No public directory or discovery — pairing is invite-only by design, which also sidesteps most of the trust/safety surface a general social app would need.

### 5.2 Golden Hour scheduling
On pairing (and whenever either partner's timezone changes), a Cloud Function computes the daily overlap between both users' typical "awake" windows (a simple default like 7am–11pm local, editable in settings) and proposes 2–3 candidate slots. One tap from either partner writes `lockedSlot`. A scheduled local notification (via `expo-notifications`, computed client-side from the locked UTC time) fires 10 minutes before, on both phones, correctly adjusted for each person's own clock.

### 5.3 Voice notes → notification sounds
Recording and playback are straightforward (`expo-av`, upload to Cloud Storage, waveform UI optional for v2). The "hear their actual voice when they call" framing needs one real constraint flagged early: **neither iOS nor Android lets a third-party app override the system ringtone for actual cellular calls.** What's buildable is: (a) a custom sound for Heartlines' *own* push notifications (both platforms support bundled custom notification sounds, refreshed per new voice note), and (b) if true "their voice plays when they call you" matters, that requires building in-app voice/video calling (CallKit on iOS, ConnectionService on Android) rather than relying on the phone's native dialer — a materially bigger build. **Decision needed from you:** ship (a) for MVP and reframe the pitch as "your voice as their notification sound," or commit to in-app calling to get the literal ringtone experience. Spec below assumes (a) for MVP; §8 lists (b) as a Phase 2 option.

### 5.4 Rituals & streaks
Each ritual has a cadence (daily, weekly, custom RRULE). A local notification reminds each partner at a set time. Completion writes a `completions/{date}` doc; a nightly Cloud Function (cron trigger) rolls up streaks per couple, using each ritual's *creator's* timezone as the canonical "day boundary" to avoid streak flicker across two timezones. Missing a day resets the streak counter but never blocks or guilts — no red badges, just the counter resetting quietly, per the concept's "not guilt-inducing" note.

### 5.5 Send a Heartbeat
Single tap → Cloud Function writes a `heartbeats` doc and sends a silent-content-only FCM push with a distinct haptic pattern (`expo-haptics` on receipt) and no required text. Rate-limited client-side (e.g. one per few minutes) to keep it feeling special rather than spammy.

### 5.6 Distance & home screen
Each user sets a home city (manual entry, geocoded once — not live GPS tracking, for both privacy and simplicity) or optionally shares live location if they choose to. Distance is a straight-line haversine calculation between the two saved coordinates. Next-trip countdown reads `nextTripDate`/`nextTripLocation` off the couple doc, editable by either partner.

### 5.7 Pixel avatars & World
Photo upload → Cloud Function calls a hosted image-to-image/style-transfer API to produce a small pixel sprite in a fixed art style → sprite stored in Cloud Storage, URL saved on the user doc. This is the highest-uncertainty feature in the whole spec (model quality, cost per generation, consistency across regenerations) — recommend prototyping this in isolation before committing it to the MVP critical path; the concept doc's placeholder-avatar mockup is a reasonable fallback if the pipeline isn't ready in time. World decor unlocks are threshold-based off combined streak milestones (defined in a simple config table, not hardcoded), rendered as layered sprites on a fixed-size room canvas.

## 6. Notifications infrastructure
All push notifications route through Firebase Cloud Messaging. Two notification classes: scheduled/local (Golden Hour reminder, ritual reminders — computed and scheduled on-device so they still fire correctly even if the device is briefly offline) and server-triggered/remote (heartbeats, new voice note, partner locked a Golden Hour slot, streak milestone reached).

## 7. Privacy & security
This is inherently a two-person, high-intimacy data set (voices, photos, daily rituals). Baseline for MVP: Firestore security rules scoped to the couple's two `memberIds` only, Cloud Storage rules mirrored the same way, TLS in transit, provider-level encryption at rest. Full end-to-end encryption of voice notes/photos is worth flagging as a Phase 2+ consideration if this becomes a real product, but is likely disproportionate effort for a validating MVP.

## 8. MVP scope vs. later phases

**Phase 1 (MVP):** pairing, Golden Hour, voice notes as custom notification sounds, rituals + streaks, heartbeat, distance/home screen, placeholder or first-pass AI avatars, static World decor tiers.

**Phase 2:** in-app voice/video calling (true ringtone experience), animated/interactive World with gifting, richer avatar pipeline, Android + iOS custom notification-sound polish, shared photo-of-the-day ritual with a lightweight feed view.

**Phase 3:** widgets/lock-screen presence (distance + local times at a glance), Apple Watch companion, deeper personalization of rituals.

## 9. Open questions for you
1. Ringtone feature: ship the notification-sound version for MVP, or commit to in-app calling now (§5.3)?
2. Sign-in method: email/password, or Sign in with Apple/Google only?
3. Avatar pipeline: worth a short isolated prototype before folding it into the MVP build, or ship placeholder avatars first and layer this in after core features work?
4. Any target platform priority — iOS first, Android first, or both together?

## 10. Proposed repo structure (for when we scaffold)

```
Heartline/
  app/                  # Expo Router screens: home, schedule, voice, rituals, world, settings
  components/           # shared UI (buttons, cards, hand-drawn heart accents)
  components/world/     # React Native Skia canvas: pixel-art World room, decor, avatars
  services/             # firebase.ts, notifications.ts, goldenHour.ts, streaks.ts
  hooks/                 # usePartner(), useGoldenHour(), useRituals()
  theme/                 # colors, Fredoka/Quicksand type scale, spacing
  functions/             # Firebase Cloud Functions (Node/TypeScript)
  Heartlines-concept.md
  Heartlines-technical-spec.md
```
