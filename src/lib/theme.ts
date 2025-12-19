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

  // Apply theme class
  root.classList.add(`theme-${theme}`);
  body?.classList.add(`theme-${theme}`);

  // Tailwind dark-mode support (for any `dark:` classes)
  if (DARK_THEMES.includes(theme)) {
    root.classList.add("dark");
    body?.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    body?.classList.remove("dark");
    root.style.colorScheme = "light";
  }

  // Persist
  try {
    localStorage.setItem("app-theme", theme);
  } catch {
    // ignore
  }

  // Let the app react
  window.dispatchEvent(new CustomEvent("app-theme-changed", { detail: { theme } }));
};
