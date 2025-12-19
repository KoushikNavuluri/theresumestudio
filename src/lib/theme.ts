export type ThemeOption =
  | "light"
  | "dark"
  | "ocean"
  | "forest"
  | "sunset"
  | "lavender"
  | "midnight"
  | "noir"
  | "dracula"
  | "cyberpunk";

export const THEMES: ThemeOption[] = [
  "light",
  "dark",
  "ocean",
  "forest",
  "sunset",
  "lavender",
  "midnight",
  "noir",
  "dracula",
  "cyberpunk",
];

export const DARK_THEMES: ThemeOption[] = [
  "dark",
  "midnight",
  "noir",
  "dracula",
  "cyberpunk",
];

export const isValidTheme = (value: string | null | undefined): value is ThemeOption => {
  return !!value && (THEMES as readonly string[]).includes(value);
};

export const getSavedTheme = (): ThemeOption => {
  const saved = typeof window !== "undefined" ? localStorage.getItem("app-theme") : null;
  return isValidTheme(saved) ? saved : "light";
};

export const applyTheme = (theme: ThemeOption) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const body = document.body || null;

  // Remove all theme classes
  THEMES.forEach((t) => {
    root.classList.remove(`theme-${t}`);
    body?.classList.remove(`theme-${t}`);
  });

  // Apply theme class to html (and body when available)
  root.classList.add(`theme-${theme}`);
  body?.classList.add(`theme-${theme}`);

  // Native controls
  root.style.colorScheme = DARK_THEMES.includes(theme) ? "dark" : "light";

  // Persist
  try {
    localStorage.setItem("app-theme", theme);
  } catch {
    // ignore
  }

  // Let the app react
  window.dispatchEvent(new CustomEvent("app-theme-changed", { detail: { theme } }));
};
