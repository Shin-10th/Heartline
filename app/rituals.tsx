import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { Card } from "../components/Card";
import { HeartAccent } from "../components/HeartAccent";
import { useRituals } from "../hooks/useRituals";

// Rituals & streaks screen. See spec section 5.4 and services/streaks.ts.
export default function RitualsScreen() {
  const { colors } = useTheme();
  const { rituals, complete, isDemo } = useRituals();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
    >
      <View style={{ gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <HeartAccent size={13} color={colors.pink} />
          <Text style={{ fontSize: 12, color: colors.textFaint }}>Small, steady, together</Text>
        </View>
        <Text style={[styles.title, { color: colors.text, fontFamily: typography.headline }]}>Rituals</Text>
        <Text style={{ fontSize: 13, color: colors.textDim, lineHeight: 19 }}>
          Tap one you've done today. Missing a day just resets the count quietly — no guilt, no red badges.
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        {rituals.map((ritual) => (
          <Pressable key={ritual.id} onPress={() => complete(ritual.id)} disabled={ritual.completedToday}>
            {({ pressed }) => (
              <Card
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  opacity: pressed ? 0.85 : 1,
                  borderColor: ritual.completedToday ? colors.pink : colors.line,
                  backgroundColor: ritual.completedToday ? colors.pinkSoft : colors.surface,
                }}
              >
                <View
                  style={[
                    styles.checkCircle,
                    {
                      backgroundColor: ritual.completedToday ? colors.pink : colors.bg,
                      borderColor: ritual.completedToday ? colors.pink : colors.line,
                    },
                  ]}
                >
                  {ritual.completedToday && <HeartAccent size={14} color={colors.surface} />}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: "700", color: colors.text }}>{ritual.label}</Text>
                  <Text style={{ fontSize: 12, color: colors.textDim }}>{ritual.cadenceLabel}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Text style={{ fontSize: 18, fontWeight: "600", color: colors.pink, fontFamily: typography.headline }}>
                    {ritual.streakCount}
                  </Text>
                  <Text style={{ fontSize: 10.5, color: colors.textFaint }}>day streak</Text>
                </View>
              </Card>
            )}
          </Pressable>
        ))}
      </View>

      {isDemo && (
        <Text style={{ fontSize: 11.5, color: colors.textFaint, textAlign: "center" }}>
          Sample rituals — connect Firebase and pair up to track these for real.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "600" },
  checkCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
});
