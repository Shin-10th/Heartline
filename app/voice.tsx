import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

// Voice notes screen. See spec section 5.3 and services/notifications.ts.
export default function VoiceScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={{ color: colors.text }}>Voice Notes — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
