import { View, StyleSheet, ViewProps } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { spacing } from "../theme/spacing";

// Shared rounded card container used on Home, Rituals, etc. Colors follow
// the active theme automatically; pass `style` for layout overrides only.
export function Card({ style, ...props }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
