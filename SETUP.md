# Heartlines — local setup

This scaffold was built remotely; **run the install step below yourself, locally**,
in a normal terminal in this folder. The remote bridge that built it is too slow for
installing thousands of node_modules files, so `node_modules` here may be incomplete
or missing — `npm install` fixes that in about a minute on a normal machine.

## 1. Install dependencies

```
npm install
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-font
npx expo install @expo-google-fonts/fredoka @expo-google-fonts/quicksand
npx expo install expo-av expo-notifications expo-location expo-secure-store expo-haptics expo-device
npx expo install @shopify/react-native-skia
npm install firebase
```

`npx expo install` (rather than plain `npm install`) picks dependency versions that match
this project's Expo SDK — use it for any Expo/React Native package, and plain `npm install`
for pure JS packages like `firebase`, `jest`, etc.

## 2. Run the app — works right away, no Firebase needed

```
npx expo start
```

Scan the QR code with Expo Go (iOS/Android). Every screen renders with realistic sample
data out of the box (`lib/demoData.ts`) — Golden Hour actually computes a real timezone
overlap, Rituals tracks streaks locally, Voice Notes really records and plays back. None
of it touches a server until you connect Firebase (next step).

## 3. Go live: connect Firebase

Create a Firebase project, enable Auth (Email/Password), Firestore, Storage, and Cloud
Messaging, then:

- copy `.env.example` to `.env` and fill in your web app config (Firebase console →
  Project settings → General → Your apps) — `services/firebase.ts` picks this up
  automatically and switches the app out of demo mode
- deploy the security rules: `firebase deploy --only firestore:rules,storage` (uses
  `firestore.rules` / `storage.rules` at the repo root — scopes every couple's data to
  its own two members, per the spec's privacy baseline)
- `cd functions && npm install` to set up Cloud Functions, then `npm run deploy` from
  that folder once you're ready to push them live (`firebase-functions` v5, modular v2 API)
- from the app, open Settings → Account & pairing to sign up and generate/redeem an
  invite code — that's what creates a `couples/{coupleId}` doc and takes every screen
  out of demo mode

## 4. Run the tests

```
npm install
npm test
```

Covers the pure logic in `lib/geo.ts`, `services/goldenHour.ts`, and `services/streaks.ts`
(distance, countdown, timezone-overlap, and streak-rollover math) — the parts worth
locking down since they have real date/timezone edge cases. Nothing UI-related is tested
yet.

## What's here

See `Heartlines-technical-spec.md` for the full architecture, data model, and feature
breakdown. All six screens under `app/` are built and interactive; `services/` and
`hooks/` talk to Firestore when `.env` is configured and fall back to `lib/demoData.ts`
otherwise, so the app is always browsable. `functions/src/index.ts` has the Golden Hour
recompute, nightly streak rollover, and heartbeat/voice-note push notifications — the
avatar-generation pipeline is intentionally left as a TODO (needs a hosted image API key;
see the spec's open questions).

## Troubleshooting: ERESOLVE / react-dom peer conflict

If `npx expo install ...` fails with an ERESOLVE error mentioning `react-dom@19.3.0`
requiring `react ^19.3.0`, it's because a package pulled in a newer `react-dom` than
the project's pinned `react` version. Fixed via an `overrides` entry in `package.json`
pinning `react-dom` to match `react` exactly — don't use `--legacy-peer-deps` or
`--force` for this, as those can silently break React elsewhere in the tree.
