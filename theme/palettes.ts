// Five accent-color themes, each with a light and dark variant.
// Hex values are exact conversions of the oklch colors used in the
// Heartlines design canvas (see Heartlines-technical-spec.md and the
// published design) -- computed via the OKLab/OKLCH -> sRGB formulas so
// the app matches the mockups pixel-for-pixel rather than eyeballing.

export type PaletteColors = {
  bg: string;
  surface: string;
  line: string;
  text: string;
  textDim: string;
  textFaint: string;
  pink: string;
  pinkSoft: string;
  lav: string;
  lavSoft: string;
  peach: string;
  peachSoft: string;
};

export type ThemeId = "bubblegum" | "sunset" | "mint" | "berry" | "midnight";

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  light: PaletteColors;
  dark: PaletteColors;
};

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  bubblegum: {
    id: "bubblegum",
    name: "Bubblegum & Lavender",
    light: { bg: "#fff3f8", surface: "#fffcfe", line: "#eed2de", text: "#5b334e", textDim: "#88657c", textFaint: "#ac8ea1", pink: "#f072b3", pinkSoft: "#ffdbed", lav: "#b88cd9", lavSoft: "#eeddfc", peach: "#fcbf95", peachSoft: "#ffe8d6" },
    dark: { bg: "#291a21", surface: "#37252d", line: "#533a45", text: "#f3e3ea", textDim: "#c7b0ba", textFaint: "#977e89", pink: "#fe8dc5", pinkSoft: "#67344e", lav: "#c79de6", lavSoft: "#4c395a", peach: "#f2b58c", peachSoft: "#613f27" },
  },
  sunset: {
    id: "sunset",
    name: "Sunset Peach",
    light: { bg: "#fff5ef", surface: "#fffcf9", line: "#f6d6c9", text: "#633c2e", textDim: "#8f6b5e", textFaint: "#af9186", pink: "#fd8358", pinkSoft: "#ffdbca", lav: "#e1b75c", lavSoft: "#f7e6c3", peach: "#f9c59c", peachSoft: "#ffead8" },
    dark: { bg: "#2e1d17", surface: "#3d2820", line: "#5d3f35", text: "#f5e4de", textDim: "#c9b1a9", textFaint: "#9a8077", pink: "#ff9670", pinkSoft: "#713d2a", lav: "#e5bf6d", lavSoft: "#57451e", peach: "#e5b28a", peachSoft: "#5c412c" },
  },
  mint: {
    id: "mint",
    name: "Mint Whisper",
    light: { bg: "#f0f9f5", surface: "#fafffc", line: "#c9e1d6", text: "#274b3c", textDim: "#5c796c", textFaint: "#889e94", pink: "#58ba93", pinkSoft: "#cdf2e0", lav: "#b6a1df", lavSoft: "#e8dffc", peach: "#dfcc99", peachSoft: "#f6eed8" },
    dark: { bg: "#11211a", surface: "#1a2e25", line: "#30483e", text: "#dfebe5", textDim: "#a9bdb3", textFaint: "#768c82", pink: "#75cca7", pinkSoft: "#245240", lav: "#bface4", lavSoft: "#463c59", peach: "#cfbc8a", peachSoft: "#51472b" },
  },
  berry: {
    id: "berry",
    name: "Berry Wine",
    light: { bg: "#fdf2f7", surface: "#fffafd", line: "#eacfdd", text: "#512d42", textDim: "#7e5e70", textFaint: "#a28695", pink: "#ac4785", pinkSoft: "#f8d1e6", lav: "#c58484", lavSoft: "#fbd7d6", peach: "#d9af7f", peachSoft: "#fbe8d3" },
    dark: { bg: "#1e1119", surface: "#2f1e27", line: "#4d3542", text: "#efe0e8", textDim: "#c0aab5", textFaint: "#907885", pink: "#d76fad", pinkSoft: "#5a2a47", lav: "#d78e8d", lavSoft: "#523030", peach: "#d2a979", peachSoft: "#4e381f" },
  },
  midnight: {
    id: "midnight",
    name: "Midnight Bloom",
    light: { bg: "#e6e2f0", surface: "#f6f3fc", line: "#c7bfd8", text: "#372d49", textDim: "#675e7a", textFaint: "#898299", pink: "#d470b5", pinkSoft: "#efcbe2", lav: "#8882db", lavSoft: "#d0d0f5", peach: "#ebaf86", peachSoft: "#fee2cf" },
    dark: { bg: "#1c1729", surface: "#282238", line: "#494260", text: "#e8e6f4", textDim: "#b8b4c9", textFaint: "#817c93", pink: "#fa8ecd", pinkSoft: "#693253", lav: "#a6a1fd", lavSoft: "#3e3b6b", peach: "#f2b58c", peachSoft: "#613f27" },
  },
};

export const THEME_LIST = Object.values(THEMES);

export const DEFAULT_THEME_ID: ThemeId = "bubblegum";
