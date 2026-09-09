import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

// Golden Hour scheduling screen. See spec section 5.2 and services/goldenHour.ts.
export default function ScheduleScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={{ color: colors.text }}>Golden Hour — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
