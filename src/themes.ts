export type ThemeId = "violet" | "ember" | "abyss" | "moss" | "steel" | "wine";

export const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
  { id: "violet", label: "фиолет", swatch: "#7c48c4" },
  { id: "ember", label: "уголь", swatch: "#c45a32" },
  { id: "abyss", label: "бездна", swatch: "#2aa0c4" },
  { id: "moss", label: "мох", swatch: "#4a9a5c" },
  { id: "steel", label: "сталь", swatch: "#6a86c8" },
  { id: "wine", label: "вино", swatch: "#b44a72" },
];
