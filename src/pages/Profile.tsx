import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  LogOut, 
  Palette, 
  Sun, 
  Moon, 
  Sparkles,
  Leaf,
  Sunset,
  Waves,
  Zap,
  Ghost,
  Skull,
  Flame
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ThemeOption = "light" | "dark" | "ocean" | "forest" | "sunset" | "lavender" | "midnight" | "noir" | "dracula" | "cyberpunk";

interface ThemeConfig {
  id: ThemeOption;
  name: string;
  icon: React.ElementType;
  colors: string;
  isDark?: boolean;
}

const themes: ThemeConfig[] = [
  // Light themes
  { id: "light", name: "Light", icon: Sun, colors: "bg-slate-100 border-slate-300" },
  { id: "ocean", name: "Ocean", icon: Waves, colors: "bg-sky-400 border-sky-300" },
  { id: "forest", name: "Forest", icon: Leaf, colors: "bg-emerald-500 border-emerald-400" },
  { id: "sunset", name: "Sunset", icon: Sunset, colors: "bg-orange-500 border-orange-400" },
  { id: "lavender", name: "Lavender", icon: Sparkles, colors: "bg-purple-400 border-purple-300" },
  // Dark themes
  { id: "dark", name: "Dark", icon: Moon, colors: "bg-slate-800 border-slate-600", isDark: true },
  { id: "midnight", name: "Midnight", icon: Moon, colors: "bg-indigo-900 border-indigo-700", isDark: true },
  { id: "noir", name: "Noir", icon: Ghost, colors: "bg-zinc-900 border-teal-500", isDark: true },
  { id: "dracula", name: "Dracula", icon: Skull, colors: "bg-purple-950 border-purple-600", isDark: true },
  { id: "cyberpunk", name: "Cyberpunk", icon: Flame, colors: "bg-fuchsia-900 border-fuchsia-500", isDark: true },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<ThemeOption>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as ThemeOption || "light";
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme: ThemeOption) => {
    const root = document.documentElement;
    
    // Remove all theme classes
    themes.forEach(t => root.classList.remove(`theme-${t.id}`));
    
    // Add new theme class
    root.classList.add(`theme-${theme}`);
    
    // Update color-scheme for proper native styling
    const themeConfig = themes.find(t => t.id === theme);
    root.style.colorScheme = themeConfig?.isDark ? "dark" : "light";
    
    localStorage.setItem("app-theme", theme);
  };

  const handleThemeChange = (theme: ThemeOption) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    toast({
      title: "Theme updated",
      description: `Switched to ${theme} theme`,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  const lightThemes = themes.filter(t => !t.isDark);
  const darkThemes = themes.filter(t => t.isDark);

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your account and preferences</p>
        </div>

        {/* Account Card */}
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
                <Separator />
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Sign In to Your Account
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Theme Card */}
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Theme
            </CardTitle>
            <CardDescription>
              Choose your preferred appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Light Themes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Light Themes</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {lightThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`
                      flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200
                      ${currentTheme === theme.id 
                        ? "border-primary bg-primary/10 scale-105 shadow-md" 
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }
                    `}
                  >
                    <div className={`w-8 h-8 rounded-full ${theme.colors} border-2 flex items-center justify-center shadow-inner`}>
                      <theme.icon className="w-4 h-4 text-foreground/80" />
                    </div>
                    <span className="text-xs font-medium">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Dark Themes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dark Themes</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  <Zap className="h-2.5 w-2.5 mr-0.5" />
                  Pro
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {darkThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`
                      flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200
                      ${currentTheme === theme.id 
                        ? "border-primary bg-primary/10 scale-105 shadow-md" 
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }
                    `}
                  >
                    <div className={`w-8 h-8 rounded-full ${theme.colors} border-2 flex items-center justify-center shadow-inner`}>
                      <theme.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
