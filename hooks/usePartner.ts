import { useEffect, useState } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../services/firebase";
import { DEMO_PARTNER } from "../lib/demoData";

const DEMO_PARTNER_INFO: PartnerInfo = {
  displayName: DEMO_PARTNER.name,
  city: DEMO_PARTNER.city,
  timezone: DEMO_PARTNER.timezone,
};

export type PartnerInfo = {
  userId?: string;
  displayName: string;
  city: string;
  timezone: string;
};

export type PartnerState = {
  partner: PartnerInfo | null;
  coupleId: string | null;
  loading: boolean;
  isDemo: boolean;
};

// Subscribes to the signed-in user's own doc for a linked coupleId, then
// looks up the partner's user doc. Falls back to sample data whenever
// Firebase isn't configured or the user hasn't paired yet, so every screen
// that reads usePartner() has something real to render either way.
//
// NOTE: pairing (app/pair.tsx) writes `coupleId` onto both users/{uid} docs
// when an invite code is accepted -- see functions/src/index.ts for the
// server-side mirror of this (invite validation + couples doc creation).
export function usePartner(): PartnerState {
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [partner, setPartner] = useState<PartnerInfo | null>(isFirebaseConfigured ? null : DEMO_PARTNER_INFO);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !auth) return;
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", uid), async (userSnap) => {
      const linkedCoupleId = userSnap.data()?.coupleId as string | undefined;
      if (!linkedCoupleId || !db) {
        setCoupleId(null);
        setPartner(null);
        setLoading(false);
        return;
      }
      setCoupleId(linkedCoupleId);
      try {
        const coupleSnap = await getDoc(doc(db, "couples", linkedCoupleId));
        const memberIds = (coupleSnap.data()?.memberIds as string[]) ?? [];
        const partnerId = memberIds.find((id) => id !== uid);
        if (!partnerId) {
          setPartner(null);
          return;
        }
        const partnerSnap = await getDoc(doc(db, "users", partnerId));
        const pdata = partnerSnap.data();
        setPartner(
          pdata
            ? {
                userId: partnerId,
                displayName: pdata.displayName ?? "your partner",
                city: pdata.homeCity?.label ?? "",
                timezone: pdata.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
              }
            : null
        );
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  return { partner, coupleId, loading, isDemo: !isFirebaseConfigured };
}
