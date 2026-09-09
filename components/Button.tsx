import { Pressable, Text, StyleSheet, GestureResponderEvent } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { spacing } from "../theme/spacing";

type Props = {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
};

// Shared rounded, playful button used across all screens. Colors follow
// the active theme automatically.
export function Button({ label, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable style={[styles.button, { backgroundColor: colors.pink }]} onPress={onPress}>
      <Text style={[styles.label, { color: colors.surface }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
  },
  label: { fontWeight: "600" },
});
