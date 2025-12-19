import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Download, 
  Share, 
  Smartphone,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-[hsl(var(--success))]/20 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-[hsl(var(--success))]" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Already Installed!</h1>
          <p className="text-muted-foreground mb-8">
            ResumeStudio is installed on your device
          </p>
          <Button onClick={() => navigate("/")} size="lg" className="gap-2">
            Open App
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md text-center"
      >
        {/* Logo */}
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-xl">
          <Smartphone className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Install ResumeStudio</h1>
        <p className="text-muted-foreground mb-8">
          Install our app for the best experience with offline access and faster loading
        </p>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {[
            "Works offline",
            "Faster loading times",
            "Home screen access",
            "Native app experience"
          ].map((feature, i) => (
            <motion.div
              key={feature}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * i }}
              className="flex items-center gap-3 text-left px-4"
            >
              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success))] flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </motion.div>
          ))}
        </div>

        {/* Install options */}
        {isIOS ? (
          <Card className="p-6 bg-card/80 border-border text-left space-y-4">
            <div className="flex items-center gap-3">
              <Share className="w-6 h-6 text-primary" />
              <div>
                <p className="font-medium text-sm">iOS Installation</p>
                <p className="text-xs text-muted-foreground">Follow these steps:</p>
              </div>
            </div>
            <ol className="text-sm space-y-2 text-muted-foreground pl-4">
              <li>1. Tap the <strong>Share</strong> button in Safari</li>
              <li>2. Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>3. Tap <strong>"Add"</strong> to install</li>
            </ol>
          </Card>
        ) : deferredPrompt ? (
          <Button 
            onClick={handleInstall} 
            size="lg" 
            className="w-full gap-2 h-14"
          >
            <Download className="w-5 h-5" />
            Install App
          </Button>
        ) : (
          <Card className="p-6 bg-card/80 border-border">
            <p className="text-sm text-muted-foreground">
              Use Chrome or Edge to install this app on your device
            </p>
          </Card>
        )}

        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => navigate("/")}
        >
          Continue in browser
        </Button>
      </motion.div>
    </div>
  );
}
