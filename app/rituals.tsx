import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

// Rituals & streaks screen. See spec section 5.4 and services/streaks.ts.
export default function RitualsScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={{ color: colors.text }}>Rituals — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
