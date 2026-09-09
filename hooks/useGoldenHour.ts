import { useMemo, useState } from "react";
import { computeOverlapWindows, OverlapSlot, AwakeWindow } from "../services/goldenHour";
import { usePartner } from "./usePartner";
import { DEMO_YOU, DEMO_PARTNER } from "../lib/demoData";

const DEFAULT_AWAKE: AwakeWindow = { startHour: 7, endHour: 23 };

export type GoldenHourState = {
  candidates: OverlapSlot[];
  lockedSlot: OverlapSlot | null;
  lockSlot: (slot: OverlapSlot) => void;
  isDemo: boolean;
  partnerName: string;
  partnerTimezone: string;
  yourTimezone: string;
};

// Subscribes to the paired partner's timezone (via usePartner) and computes
// today's overlap windows client-side for an instant preview. The locked
// slot is only local state for now -- TODO once paired: persist it to
// couples/{coupleId}/goldenHour.lockedSlot instead (spec section 5.2), which
// is also what the Cloud Function recomputes candidates into on pairing /
// timezone change.
export function useGoldenHour(): GoldenHourState {
  const { partner, isDemo } = usePartner();
  const [lockedSlot, setLockedSlot] = useState<OverlapSlot | null>(null);

  const yourTimezone = isDemo ? DEMO_YOU.timezone : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const partnerTimezone = partner?.timezone ?? DEMO_PARTNER.timezone;
  const partnerName = isDemo ? DEMO_PARTNER.name : partner?.displayName ?? "your partner";

  const candidates = useMemo(
    () => computeOverlapWindows(yourTimezone, DEFAULT_AWAKE, partnerTimezone, DEFAULT_AWAKE),
    [yourTimezone, partnerTimezone]
  );

  return { candidates, lockedSlot, lockSlot: setLockedSlot, isDemo, partnerName, partnerTimezone, yourTimezone };
}
