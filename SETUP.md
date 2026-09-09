# Heartlines — local setup

This scaffold was created remotely; **run the install step below yourself, locally**,
in a normal terminal in this folder. The remote bridge that built this scaffold is too
slow for installing thousands of node_modules files, so `node_modules` here may be
incomplete or missing — `npm install` fixes that in about a minute on a normal machine.

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
for pure JS packages like `firebase`.

## 2. Firebase project

Create a Firebase project, enable Auth, Firestore, Storage, and Cloud Messaging, then:
- copy `.env.example` to `.env` and fill in your web app config
- `cd functions && npm install` to set up Cloud Functions

## 3. Run the app

```
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) to preview on your phone.

## What's here

See `Heartlines-technical-spec.md` for the full architecture, data model, and feature
breakdown. Screens under `app/` and services under `services/`/`functions/` are scaffolded
with TODOs matching that spec — nothing is wired up to Firebase yet.

## Troubleshooting: ERESOLVE / react-dom peer conflict

If `npx expo install ...` fails with an ERESOLVE error mentioning `react-dom@19.3.0`
requiring `react ^19.3.0`, it's because a package pulled in a newer `react-dom` than
the project's pinned `react` version. Fixed via an `overrides` entry in `package.json`
pinning `react-dom` to match `react` exactly — don't use `--legacy-peer-deps` or
`--force` for this, as those can silently break React elsewhere in the tree.
