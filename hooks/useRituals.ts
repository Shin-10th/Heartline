import { useState } from "react";
import * as Haptics from "expo-haptics";
import { DEMO_RITUALS, DemoRitual } from "../lib/demoData";
import { nextStreakCount } from "../services/streaks";
import { isFirebaseConfigured } from "../services/firebase";

// TODO once paired: subscribe to couples/{coupleId}/rituals + today's
// completions/{date} docs instead of local state, and write a completion doc
// on complete() so the nightly Cloud Function (functions/src/index.ts) can
// roll streaks up from real data instead of client-computed state.
export function useRituals() {
  const [rituals, setRituals] = useState<DemoRitual[]>(DEMO_RITUALS);

  function complete(id: string) {
    setRituals((prev) =>
      prev.map((r) =>
        r.id === id && !r.completedToday
          ? { ...r, completedToday: true, streakCount: nextStreakCount(r.streakCount, true) }
          : r
      )
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }

  return { rituals, complete, loading: false, isDemo: !isFirebaseConfigured };
}
