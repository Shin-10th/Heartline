import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useTheme } from "../theme/ThemeContext";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { HeartAccent } from "../components/HeartAccent";
import { auth, isFirebaseConfigured } from "../services/firebase";
import { registerForPushNotificationsAsync } from "../services/notifications";

// Settings screen: the working theme picker (light/dark + five accent
// palettes) from the design canvas, plus a couple of standard rows.
export default function SettingsScreen() {
  const { colors, themeId, mode, setThemeId, setMode, themeList } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  async function handleNotificationsPress() {
    const token = await registerForPushNotificationsAsync();
    Alert.alert(
      token ? "Notifications enabled" : "Couldn't enable notifications",
      token
        ? "This device is registered for heartbeats, streak milestones, and reminders."
        : "That needs a physical device with permission granted, and (for remote push) a configured EAS project."
    );
  }

  function handleSignOut() {
    if (!isFirebaseConfigured || !auth?.currentUser) {
      Alert.alert("Not signed in", "Connect Firebase and sign in from Account & pairing first.");
      return;
    }
    signOut(auth);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: 40,
        paddingHorizontal: spacing.lg,
        gap: spacing.lg,
      }}
    >
      {/* header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 22, color: colors.textFaint }}>{"\u2039"}</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text, fontFamily: typography.headline }]}>Settings</Text>
      </View>

      {/* Appearance */}
      <View style={{ gap: spacing.md }}>
        <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>Appearance</Text>

        {/* live preview */}
        <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 17, fontWeight: "600", color: colors.text, fontFamily: typography.headline }}>
              Heartlines
            </Text>
            <HeartAccent size={12} color={colors.pink} />
          </View>
          <View style={[styles.previewButton, { backgroundColor: colors.pink }]}>
            <HeartAccent size={13} color={colors.surface} />
            <Text style={{ fontSize: 12.5, fontWeight: "700", color: colors.surface }}>Send a heartbeat</Text>
          </View>
        </View>

        {/* light / dark */}
        <View style={[styles.segment, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Pressable
            style={[styles.segmentOption, mode === "light" && { backgroundColor: colors.pink }]}
            onPress={() => setMode("light")}
          >
            <Text style={{ fontSize: 12.5, fontWeight: "700", color: mode === "light" ? colors.surface : colors.textFaint }}>
              Light
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentOption, mode === "dark" && { backgroundColor: colors.pink }]}
            onPress={() => setMode("dark")}
          >
            <Text style={{ fontSize: 12.5, fontWeight: "700", color: mode === "dark" ? colors.surface : colors.textFaint }}>
              Dark
            </Text>
          </Pressable>
        </View>

        {/* theme swatches */}
        <View style={styles.swatchRow}>
          {themeList.map((theme) => {
            const selected = theme.id === themeId;
            const tv = mode === "dark" ? theme.dark : theme.light;
            return (
              <Pressable key={theme.id} style={styles.swatchItem} onPress={() => setThemeId(theme.id)}>
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: tv.pink },
                    selected && {
                      borderWidth: 3,
                      borderColor: colors.surface,
                      shadowColor: tv.pink,
                      shadowOpacity: 0.6,
                      shadowRadius: 4,
                    },
                  ]}
                >
                  <View style={[styles.swatchHalf, { backgroundColor: tv.lav }]} />
                </View>
                <Text
                  style={{
                    fontSize: 9.5,
                    textAlign: "center",
                    color: selected ? colors.text : colors.textFaint,
                    fontWeight: selected ? "700" : "600",
                  }}
                  numberOfLines={2}
                >
                  {theme.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* other rows */}
      <View style={[styles.rowsCard, { borderColor: colors.line, backgroundColor: colors.surface }]}>
        <Pressable style={[styles.row, { borderBottomColor: colors.line }]} onPress={handleNotificationsPress}>
          <Text style={{ fontSize: 13.5, color: colors.text, flex: 1 }}>Notifications</Text>
          <Text style={{ color: colors.textFaint }}>{"\u203a"}</Text>
        </Pressable>
        <Pressable style={[styles.row, { borderBottomColor: colors.line }]} onPress={() => router.push("/pair")}>
          <Text style={{ fontSize: 13.5, color: colors.text, flex: 1 }}>Account & pairing</Text>
          <Text style={{ color: colors.textFaint }}>{"\u203a"}</Text>
        </Pressable>
        <Pressable style={[styles.row, { borderBottomWidth: 0 }]} onPress={handleSignOut}>
          <Text style={{ fontSize: 13.5, color: colors.textFaint }}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 21, fontWeight: "600" },
  sectionLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  previewCard: { borderRadius: 22, borderWidth: 1.5, padding: 18, gap: 14 },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  segment: { flexDirection: "row", borderRadius: 16, borderWidth: 1.5, padding: 4, gap: 4 },
  segmentOption: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 12 },
  swatchRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  swatchItem: { alignItems: "center", gap: 7, flex: 1 },
  swatch: { width: 44, height: 44, borderRadius: 22, overflow: "hidden", flexDirection: "row" },
  swatchHalf: { flex: 1 },
  rowsCard: { borderRadius: 20, borderWidth: 1.5, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 15, paddingHorizontal: 18, borderBottomWidth: 1.5 },
});
