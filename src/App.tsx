import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Saved from "./pages/Saved";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import { SplashScreen } from "./components/SplashScreen";
import { Onboarding } from "./components/Onboarding";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

// Dark theme IDs for color-scheme setting
const darkThemes = ["dark", "midnight", "noir", "dracula", "cyberpunk"];
const validThemes = ["light", "dark", "ocean", "forest", "sunset", "lavender", "midnight", "noir", "dracula", "cyberpunk"];

// Apply theme immediately before React hydration
const applyThemeImmediate = () => {
  const savedTheme = localStorage.getItem("app-theme") || "light";
  const theme = validThemes.includes(savedTheme) ? savedTheme : "light";
  const root = document.documentElement;
  
  // Remove all possible theme classes first
  validThemes.forEach(t => root.classList.remove(`theme-${t}`));
  
  // Apply theme class
  root.classList.add(`theme-${theme}`);
  
  // Set color-scheme for proper native styling
  root.style.colorScheme = darkThemes.includes(theme) ? "dark" : "light";
};

// Run immediately
applyThemeImmediate();

// Theme initialization - runs on app load
function ThemeInit() {
  useEffect(() => {
    // Re-apply theme on mount to ensure it's set
    applyThemeImmediate();
    
    // Hide native splash screen after React loads
    const splash = document.getElementById("splash-screen");
    if (splash) {
      splash.classList.add("fade-out");
      setTimeout(() => splash.remove(), 500);
    }
    
    // Listen for storage changes (theme changed in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "app-theme") {
        applyThemeImmediate();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  
  return null;
}

// App content with onboarding logic
function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    // Check if onboarding was completed
    const onboardingComplete = localStorage.getItem("onboarding-complete");
    
    // Show onboarding for new users after sign up
    if (!loading && user && !onboardingComplete) {
      setShowOnboarding(true);
    }
  }, [user, loading]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Hide main app content during splash or onboarding
  const showMainContent = !showSplash && !showOnboarding;

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!showSplash && showOnboarding && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      {showMainContent && (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help" element={<Help />} />
            <Route path="/install" element={<Install />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeInit />
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
