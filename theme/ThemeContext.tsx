import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { THEMES, THEME_LIST, DEFAULT_THEME_ID, PaletteColors, ThemeId } from "./palettes";

export type ColorMode = "light" | "dark";

type ThemeContextValue = {
  themeId: ThemeId;
  mode: ColorMode;
  colors: PaletteColors;
  setThemeId: (id: ThemeId) => void;
  setMode: (mode: ColorMode) => void;
  themeList: typeof THEME_LIST;
};

// Not sensitive data -- SecureStore is used here only because it's already
// a project dependency; swap for AsyncStorage if that changes.
const STORAGE_KEY = "heartlines-theme-preference";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [mode, setModeState] = useState<ColorMode>(systemScheme === "dark" ? "dark" : "light");
  const [hydrated, setHydrated] = useState(false);

  // Load any saved preference once on mount. Falls back to the system
  // color scheme + the default theme when nothing is saved yet, or when
  // SecureStore isn't available on this platform.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        if (!cancelled && raw) {
          const saved = JSON.parse(raw) as { themeId?: ThemeId; mode?: ColorMode };
          if (saved.themeId && THEMES[saved.themeId]) setThemeIdState(saved.themeId);
          if (saved.mode === "light" || saved.mode === "dark") setModeState(saved.mode);
        }
      } catch {
        // No saved preference yet, or SecureStore unavailable -- use the defaults.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every change, once the initial load has happened (so we
  // don't immediately overwrite a saved preference with the defaults).
  useEffect(() => {
    if (!hydrated) return;
    SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify({ themeId, mode })).catch(() => {});
  }, [themeId, mode, hydrated]);

  const colors = THEMES[themeId][mode];

  const value = useMemo<ThemeContextValue>(
    () => ({ themeId, mode, colors, setThemeId: setThemeIdState, setMode: setModeState, themeList: THEME_LIST }),
    [themeId, mode, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
