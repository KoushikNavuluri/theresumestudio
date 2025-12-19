export type ThemeOption = 
  | "light" 
  | "ocean" 
  | "forest" 
  | "sunset" 
  | "lavender"
  | "dark" 
  | "midnight" 
  | "noir" 
  | "dracula" 
  | "cyberpunk";

export interface ThemeConfig {
  id: ThemeOption;
  name: string;
  isDark: boolean;
  preview: string; // Tailwind classes for preview circle
}

export const THEMES: ThemeConfig[] = [
  // Light themes
  { id: "light", name: "Light", isDark: false, preview: "bg-slate-100 border-slate-300" },
  { id: "ocean", name: "Ocean", isDark: false, preview: "bg-sky-400 border-sky-500" },
  { id: "forest", name: "Forest", isDark: false, preview: "bg-emerald-500 border-emerald-600" },
  { id: "sunset", name: "Sunset", isDark: false, preview: "bg-orange-500 border-orange-600" },
  { id: "lavender", name: "Lavender", isDark: false, preview: "bg-purple-400 border-purple-500" },
  // Dark themes
  { id: "dark", name: "Dark", isDark: true, preview: "bg-slate-800 border-slate-600" },
  { id: "midnight", name: "Midnight", isDark: true, preview: "bg-indigo-900 border-indigo-700" },
  { id: "noir", name: "Noir", isDark: true, preview: "bg-zinc-900 border-teal-500" },
  { id: "dracula", name: "Dracula", isDark: true, preview: "bg-purple-950 border-purple-500" },
  { id: "cyberpunk", name: "Cyberpunk", isDark: true, preview: "bg-fuchsia-900 border-cyan-400" },
];

export const LIGHT_THEMES = THEMES.filter(t => !t.isDark);
export const DARK_THEMES = THEMES.filter(t => t.isDark);

const THEME_IDS = THEMES.map(t => t.id);

export const isValidTheme = (value: string | null): value is ThemeOption => {
  return value !== null && THEME_IDS.includes(value as ThemeOption);
};

export const getSavedTheme = (): ThemeOption => {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("app-theme");
  return isValidTheme(saved) ? saved : "light";
};

export const applyTheme = (theme: ThemeOption) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const config = THEMES.find(t => t.id === theme);
  
  // Remove all theme classes
  THEME_IDS.forEach(id => root.classList.remove(`theme-${id}`));
  root.classList.remove("dark");

  // Apply new theme
  root.classList.add(`theme-${theme}`);
  
  // Add dark class for Tailwind dark mode
  if (config?.isDark) {
    root.classList.add("dark");
  }

  // Set color scheme for native elements
  root.style.colorScheme = config?.isDark ? "dark" : "light";

  // Persist
  try {
    localStorage.setItem("app-theme", theme);
  } catch {
    // ignore
  }
};
