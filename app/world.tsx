import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { Card } from "../components/Card";
import { HeartAccent } from "../components/HeartAccent";
import { WorldCanvas } from "../components/world/WorldCanvas";
import { DEMO_STREAK_DAYS, WORLD_DECOR_THRESHOLDS } from "../lib/demoData";

// Shared pixel-art World screen. See spec section 5.7 and components/world/WorldCanvas.tsx.
export default function WorldScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const canvasWidth = Math.min(width - spacing.lg * 2, 400);
  const canvasHeight = canvasWidth * 0.72;

  // TODO once paired: read streakDays and decorUnlocked from
  // couples/{coupleId}.world instead of the demo constant.
  const unlockedDecorIds = WORLD_DECOR_THRESHOLDS.filter((d) => DEMO_STREAK_DAYS >= d.streakDays).map((d) => d.id);
  const nextDecor = WORLD_DECOR_THRESHOLDS.find((d) => DEMO_STREAK_DAYS < d.streakDays);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
    >
      <View style={{ gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <HeartAccent size={13} color={colors.pink} />
          <Text style={{ fontSize: 12, color: colors.textFaint }}>Your shared room</Text>
        </View>
        <Text style={[styles.title, { color: colors.text, fontFamily: typography.headline }]}>World</Text>
        <Text style={{ fontSize: 13, color: colors.textDim, lineHeight: 19 }}>
          Your pixel selves live here together. New decor unlocks as your streaks grow.
        </Text>
      </View>

      <View style={{ borderRadius: 22, overflow: "hidden", borderWidth: 1.5, borderColor: colors.line, alignSelf: "center" }}>
        <WorldCanvas width={canvasWidth} height={canvasHeight} colors={colors} unlockedDecorIds={unlockedDecorIds} />
      </View>

      <Card style={{ gap: spacing.sm }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>Decor unlocked</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {WORLD_DECOR_THRESHOLDS.map((d) => {
            const unlocked = unlockedDecorIds.includes(d.id);
            return (
              <View
                key={d.id}
                style={[
                  styles.decorChip,
                  { backgroundColor: unlocked ? colors.pinkSoft : colors.bg, borderColor: unlocked ? colors.pink : colors.line },
                ]}
              >
                <Text style={{ fontSize: 11.5, fontWeight: "700", color: unlocked ? colors.text : colors.textFaint }}>{d.label}</Text>
                <Text style={{ fontSize: 10, color: colors.textFaint }}>{d.streakDays}-day streak</Text>
              </View>
            );
          })}
        </View>
        {nextDecor && (
          <Text style={{ fontSize: 12, color: colors.textDim, marginTop: 4 }}>
            {nextDecor.streakDays - DEMO_STREAK_DAYS} more days to unlock {nextDecor.label.toLowerCase()}.
          </Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "600" },
  decorChip: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 6, paddingHorizontal: 10, gap: 1 },
});
