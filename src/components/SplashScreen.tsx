import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export function SplashScreen({ onComplete, minDuration = 1500 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      // Wait for exit animation
      setTimeout(onComplete, 500);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(230 35% 12%) 50%, hsl(250 35% 15%) 100%)"
      }}
    >
      {/* Animated logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="relative"
      >
        {/* Glow effect */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-accent blur-xl"
        />
        
        {/* Logo container */}
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl">
          <FileText className="w-10 h-10 text-white" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-2xl font-bold text-foreground"
      >
        ResumeStudio
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-2 text-sm text-muted-foreground"
      >
        AI-Powered Resume Generator
      </motion.p>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 w-32 h-1 bg-muted rounded-full overflow-hidden"
      >
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ 
            duration: 1.2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-1/2 h-full bg-gradient-to-r from-primary to-accent rounded-full"
        />
      </motion.div>
    </motion.div>
  );
}
