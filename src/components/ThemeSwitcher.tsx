import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THEMES, type ThemeOption } from "@/lib/theme";
import { useTheme } from "@/hooks/useTheme";

const THEME_LABEL: Record<ThemeOption, string> = {
  light: "Light",
  dark: "Dark",
  ocean: "Ocean",
  forest: "Forest",
  sunset: "Sunset",
  lavender: "Lavender",
  midnight: "Midnight",
  noir: "Noir",
  dracula: "Dracula",
  cyberpunk: "Cyberpunk",
};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <Select value={theme} onValueChange={(v) => setTheme(v as ThemeOption)}>
      <SelectTrigger className="h-9 w-[140px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent align="end">
        {THEMES.map((t) => (
          <SelectItem key={t} value={t}>
            {THEME_LABEL[t]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
