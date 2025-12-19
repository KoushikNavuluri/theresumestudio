import { useEffect, useState } from "react";
import type { ThemeOption } from "@/lib/theme";
import { applyTheme, getSavedTheme } from "@/lib/theme";

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeOption>(() => getSavedTheme());

  useEffect(() => {
    const sync = () => setTheme(getSavedTheme());

    const onThemeChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail as { theme?: ThemeOption } | undefined;
      if (detail?.theme) setTheme(detail.theme);
      else sync();
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === "app-theme") sync();
    };

    window.addEventListener("app-theme-changed", onThemeChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("app-theme-changed", onThemeChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setAndApplyTheme = (next: ThemeOption) => {
    setTheme(next);
    applyTheme(next);
  };

  return { theme, setTheme: setAndApplyTheme };
};
