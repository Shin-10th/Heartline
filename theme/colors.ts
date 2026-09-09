// Legacy static palette -- superseded by theme/ThemeContext's useTheme(),
// which every screen now uses. Kept only so a stray old import doesn't
// break the build; prefer useTheme() in new code.
import { THEMES } from "./palettes";

const base = THEMES.bubblegum.light;

export const colors = {
  background: base.bg,
  bubblegum: base.pink,
  lavender: base.lav,
  text: base.text,
  textMuted: base.textDim,
  card: base.surface,
  streak: base.peach,
};
