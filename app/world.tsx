import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

// Shared pixel-art World screen. See spec section 5.7 and components/world/WorldCanvas.tsx.
// Rendering uses @shopify/react-native-skia (already installed).
export default function WorldScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={{ color: colors.text }}>World — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
