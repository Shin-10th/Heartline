import { Text, TextStyle } from "react-native";

// Small heart accent used throughout the UI (wordmark, buttons, streak
// rows). A Unicode glyph for now -- zero extra dependency; swap for a
// custom vector asset or react-native-svg path later if it needs to look
// hand-drawn rather than a system glyph.
export function HeartAccent({
  size = 14,
  color = "#f072b3",
  style,
}: {
  size?: number;
  color?: string;
  style?: TextStyle;
}) {
  return <Text style={[{ fontSize: size, color, lineHeight: size * 1.15 }, style]}>{"\u2665"}</Text>;
}
