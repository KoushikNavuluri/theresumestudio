import { useState, useEffect, useCallback } from "react";
import type { ThemeOption } from "@/lib/theme";
import { applyTheme, getSavedTheme } from "@/lib/theme";

export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeOption>(() => getSavedTheme());

  useEffect(() => {
    // Sync on mount
    const saved = getSavedTheme();
    setThemeState(saved);
    applyTheme(saved);

    // Listen for changes from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "app-theme") {
        const newTheme = getSavedTheme();
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setTheme = useCallback((newTheme: ThemeOption) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  }, []);

  return { theme, setTheme };
};
