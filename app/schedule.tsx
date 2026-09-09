import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { Card } from "../components/Card";
import { HeartAccent } from "../components/HeartAccent";
import { useGoldenHour } from "../hooks/useGoldenHour";
import { formatLocalTime } from "../lib/geo";
import { scheduleGoldenHourReminder } from "../services/notifications";
import type { OverlapSlot } from "../services/goldenHour";

// Golden Hour scheduling screen. See spec section 5.2 and services/goldenHour.ts.
export default function ScheduleScreen() {
  const { colors } = useTheme();
  const { candidates, lockedSlot, lockSlot, isDemo, partnerName, partnerTimezone, yourTimezone } = useGoldenHour();
  const [scheduling, setScheduling] = useState(false);

  function slotTimeRange(slot: OverlapSlot) {
    const start = new Date(slot.startUtc);
    const end = new Date(start.getTime() + slot.durationMin * 60000);
    return {
      you: `${formatLocalTime(start, yourTimezone)}–${formatLocalTime(end, yourTimezone)}`,
      partner: `${formatLocalTime(start, partnerTimezone)}–${formatLocalTime(end, partnerTimezone)}`,
    };
  }

  async function handleLock(slot: OverlapSlot) {
    lockSlot(slot);
    setScheduling(true);
    try {
      await scheduleGoldenHourReminder(slot.startUtc, 10);
    } finally {
      setScheduling(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
    >
      <View style={{ gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <HeartAccent size={13} color={colors.pink} />
          <Text style={{ fontSize: 12, color: colors.textFaint }}>Your daily overlap</Text>
        </View>
        <Text style={[styles.title, { color: colors.text, fontFamily: typography.headline }]}>Golden Hour</Text>
        <Text style={{ fontSize: 13, color: colors.textDim, lineHeight: 19 }}>
          The stretch of your day when you're both awake at once
          {isDemo ? " — shown here with sample timezones until you're paired" : ""}.
        </Text>
      </View>

      {lockedSlot ? (
        <Card style={{ gap: 8, borderColor: colors.pink, backgroundColor: colors.pinkSoft }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <HeartAccent size={14} color={colors.pink} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>Locked in</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text, fontFamily: typography.headline }}>
            {slotTimeRange(lockedSlot).you} your time
          </Text>
          <Text style={{ fontSize: 12.5, color: colors.textDim }}>
            {slotTimeRange(lockedSlot).partner} for {partnerName} · reminder set for 10 minutes before
          </Text>
        </Card>
      ) : (
        <Text style={{ fontSize: 12.5, color: colors.textFaint }}>Tap a window below to lock it in for both of you.</Text>
      )}

      <View style={{ gap: spacing.sm }}>
        {candidates.length === 0 ? (
          <Card>
            <Text style={{ color: colors.textDim, fontSize: 13 }}>No overlap found for today's awake hours yet.</Text>
          </Card>
        ) : (
          candidates.map((slot, i) => {
            const range = slotTimeRange(slot);
            const isLocked = lockedSlot?.startUtc === slot.startUtc;
            return (
              <Pressable key={slot.startUtc} onPress={() => handleLock(slot)}>
                {({ pressed }) => (
                  <Card
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderColor: isLocked ? colors.pink : colors.line,
                      opacity: pressed ? 0.85 : 1,
                    }}
                  >
                    <View style={{ gap: 2 }}>
                      <Text style={{ fontSize: 14.5, fontWeight: "700", color: colors.text }}>
                        Option {i + 1} · {range.you}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textDim }}>
                        {range.partner} for {partnerName} · {slot.durationMin} min window
                      </Text>
                    </View>
                    {isLocked && <HeartAccent size={16} color={colors.pink} />}
                  </Card>
                )}
              </Pressable>
            );
          })
        )}
      </View>
      {scheduling && <ActivityIndicator color={colors.pink} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "600" },
});
