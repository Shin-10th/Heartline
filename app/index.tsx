import { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../theme/ThemeContext";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { HeartAccent } from "../components/HeartAccent";
import { Card } from "../components/Card";
import { DEMO_YOU, DEMO_PARTNER, DEMO_NEXT_TRIP, DEMO_STREAK_DAYS } from "../lib/demoData";
import { haversineMiles, daysUntil, formatShortDate, formatLocalTime } from "../lib/geo";

// Home screen: both partners' local times, distance apart, next-trip
// countdown, a one-tap "heartbeat", and a peek at the shared World.
// Numbers below are computed from lib/demoData.ts + lib/geo.ts until
// pairing and the backend are wired up (spec section 5.6) -- once paired,
// swap these for usePartner()/useGoldenHour() the same way Schedule/Rituals do.
const DATA = {
  partnerName: DEMO_PARTNER.name,
  yourCity: DEMO_YOU.city,
  partnerCity: DEMO_PARTNER.city,
  yourTime: formatLocalTime(new Date(), DEMO_YOU.timezone),
  partnerTime: formatLocalTime(new Date(), DEMO_PARTNER.timezone),
  milesApart: Math.round(haversineMiles(DEMO_YOU.homeLatLng, DEMO_PARTNER.homeLatLng)),
  nextTripDays: daysUntil(DEMO_NEXT_TRIP.date),
  nextTripDate: formatShortDate(DEMO_NEXT_TRIP.date),
  streakDays: DEMO_STREAK_DAYS,
};

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [heartbeatSent, setHeartbeatSent] = useState(false);

  async function handleHeartbeat() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setHeartbeatSent(true);
    setTimeout(() => setHeartbeatSent(false), 2200);
    // TODO once paired: write couples/{coupleId}/heartbeats/{id} here and let
    // the sendHeartbeat Cloud Function (functions/src/index.ts) fan out the
    // push to {partnerName}'s phone (spec section 5.5).
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: 40,
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
      }}
    >
      {/* header */}
      <View style={styles.headerRow}>
        <View style={{ gap: 3 }}>
          <Text style={{ fontSize: 13, color: colors.textFaint }}>Good evening, Aki</Text>
          <View style={styles.wordmarkRow}>
            <Text style={[styles.wordmark, { color: colors.text, fontFamily: typography.headline }]}>
              Heartlines
            </Text>
            <HeartAccent size={15} color={colors.pink} />
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          style={[styles.gearButton, { backgroundColor: colors.surface, borderColor: colors.line }]}
        >
          <Text style={{ fontSize: 16 }}>{"⚙"}</Text>
        </Pressable>
      </View>

      {/* distance card */}
      <Card style={{ gap: spacing.md }}>
        <View style={styles.distanceRow}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 12, color: colors.textFaint }}>You · {DATA.yourCity}</Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{DATA.yourTime}</Text>
          </View>
          <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 10 }}>
            <View style={[styles.dashLine, { backgroundColor: colors.line }]} />
            <HeartAccent size={12} color={colors.pink} style={{ marginTop: -7 }} />
          </View>
          <View style={{ gap: 2, alignItems: "flex-end" }}>
            <Text style={{ fontSize: 12, color: colors.textFaint }}>
              {DATA.partnerName} · {DATA.partnerCity}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{DATA.partnerTime}</Text>
          </View>
        </View>
        <Text style={{ textAlign: "center", fontSize: 12, color: colors.textDim }}>
          {DATA.milesApart.toLocaleString()} miles apart, one little heart's flight
        </Text>
      </Card>

      {/* countdown card */}
      <Card style={{ gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <HeartAccent size={12} color={colors.pink} />
          <Text style={{ fontSize: 12, color: colors.textFaint }}>Until you're in {DATA.partnerCity}</Text>
        </View>
        <Text style={{ fontSize: 42, fontWeight: "600", color: colors.pink, fontFamily: typography.headline }}>
          {DATA.nextTripDays} days
        </Text>
        <Text style={{ fontSize: 13, color: colors.textDim }}>{DATA.nextTripDate} · flight already saved to Rituals</Text>
      </Card>

      {/* send a heartbeat */}
      <Pressable onPress={handleHeartbeat}>
        {({ pressed }) => (
          <Card
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              opacity: pressed ? 0.85 : 1,
              borderColor: heartbeatSent ? colors.pink : colors.line,
              backgroundColor: heartbeatSent ? colors.pinkSoft : colors.surface,
            }}
          >
            <View style={[styles.heartbeatCircle, { backgroundColor: colors.pink }]}>
              <HeartAccent size={26} color={colors.surface} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                {heartbeatSent ? "Sent ♥" : "Send a heartbeat"}
              </Text>
              <Text style={{ fontSize: 12.5, color: colors.textDim, lineHeight: 17 }}>
                {heartbeatSent
                  ? `On its way to ${DATA.partnerName}'s phone — no words needed.`
                  : `One tap sends a soft little buzz to ${DATA.partnerName}'s phone — no words needed.`}
              </Text>
            </View>
          </Card>
        )}
      </Pressable>

      {/* streak row */}
      <View style={[styles.streakRow, { backgroundColor: colors.pinkSoft }]}>
        <HeartAccent size={16} color={colors.pink} />
        <Text style={{ fontSize: 13, color: colors.textDim, flex: 1 }}>
          {DATA.streakDays}-day good morning streak
        </Text>
      </View>

      {/* pixel selves -- placeholder blocks until the real photo-to-pixel
          pipeline + react-native-skia World canvas exist (spec 5.7) */}
      <Pressable onPress={() => router.push("/world")}>
        {({ pressed }) => (
          <Card style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, opacity: pressed ? 0.85 : 1 }}>
            <View style={styles.avatarRow}>
              <View style={[styles.avatar, { backgroundColor: colors.pink }]} />
              <View style={[styles.avatar, styles.avatarOverlap, { backgroundColor: colors.lav }]} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>Your pixel selves</Text>
              <Text style={{ fontSize: 11.5, color: colors.textDim }}>
                Made from your photos · living together in your Room
              </Text>
            </View>
          </Card>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  wordmarkRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  wordmark: { fontSize: 23, fontWeight: "600" },
  gearButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  distanceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dashLine: { height: 1.5, width: "100%", borderRadius: 1 },
  heartbeatCircle: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 18, padding: 14 },
  avatarRow: { flexDirection: "row" },
  avatar: { width: 34, height: 34, borderRadius: 12 },
  avatarOverlap: { marginLeft: -10 },
});
