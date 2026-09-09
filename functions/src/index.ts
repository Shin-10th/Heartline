import * as admin from "firebase-admin";

admin.initializeApp();

// TODO per spec section 3 & 5:
//   - pairing (invite code validation, create couples doc)
//   - Golden Hour recompute on timezone change (services/goldenHour.ts logic, ported here)
//   - nightly streak rollover (scheduled function)
//   - notification fan-out (heartbeats, new voice note, milestones) via FCM
//   - avatar generation job (photo upload -> hosted image model -> pixel sprite)
