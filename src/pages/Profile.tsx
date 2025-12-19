import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  Waves
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ThemeOption = "light" | "dark" | "ocean" | "forest" | "sunset" | "lavender";

const themes: { id: ThemeOption; name: string; icon: React.ElementType; colors: string }[] = [
  { id: "light", name: "Light", icon: Sun, colors: "bg-slate-100 border-slate-200" },
  { id: "dark", name: "Dark", icon: Moon, colors: "bg-slate-800 border-slate-700" },
  { id: "ocean", name: "Ocean", icon: Waves, colors: "bg-blue-500 border-blue-400" },
  { id: "forest", name: "Forest", icon: Leaf, colors: "bg-emerald-500 border-emerald-400" },
  { id: "sunset", name: "Sunset", icon: Sunset, colors: "bg-orange-500 border-orange-400" },
  { id: "lavender", name: "Lavender", icon: Sparkles, colors: "bg-purple-500 border-purple-400" },
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
    root.classList.remove("theme-light", "theme-dark", "theme-ocean", "theme-forest", "theme-sunset", "theme-lavender");
    
    // Add new theme class
    root.classList.add(`theme-${theme}`);
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

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
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
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                    ${currentTheme === theme.id 
                      ? "border-primary bg-primary/10 scale-105" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }
                  `}
                >
                  <div className={`w-10 h-10 rounded-full ${theme.colors} border-2 flex items-center justify-center`}>
                    <theme.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium">{theme.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
