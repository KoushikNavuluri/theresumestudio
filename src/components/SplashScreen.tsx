import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export function SplashScreen({ onComplete, minDuration = 2000 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 600);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(230 35% 8%) 0%, hsl(250 40% 12%) 50%, hsl(270 35% 15%) 100%)"
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/20"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, Math.random() * -200 - 100],
              opacity: [0.3, 0]
            }}
            transition={{ 
              duration: Math.random() * 3 + 2, 
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Glowing orb background */}
      <motion.div
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-96 h-96 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(260 80% 60% / 0.4) 0%, transparent 70%)"
        }}
      />

      {/* Secondary glowing orb */}
      <motion.div
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.3, 0.15]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
        className="absolute w-80 h-80 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(220 80% 50% / 0.3) 0%, transparent 70%)"
        }}
      />

      {/* Main logo container */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          delay: 0.2, 
          type: "spring", 
          stiffness: 200,
          damping: 15
        }}
        className="relative z-10"
      >
        {/* Outer ring animation */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-4"
        >
          <div className="w-full h-full rounded-full border-2 border-dashed border-white/10" />
        </motion.div>

        {/* Pulsing glow effect */}
        <motion.div
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.5, 0.2, 0.5]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-3xl blur-xl"
          style={{
            background: "linear-gradient(135deg, hsl(260 80% 60%), hsl(220 80% 50%))"
          }}
        />
        
        {/* Logo container */}
        <motion.div 
          className="relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(260 70% 55%), hsl(220 80% 50%))"
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut"
            }}
            className="absolute inset-0 w-1/2"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)"
            }}
          />
          
          <motion.div
            animate={{ 
              rotateY: [0, 10, -10, 0],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <FileText className="w-12 h-12 text-white drop-shadow-lg" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Title with staggered animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 text-center z-10"
      >
        <motion.h1
          className="text-3xl font-bold tracking-tight"
          style={{
            background: "linear-gradient(135deg, #fff 0%, hsl(260 80% 80%) 50%, hsl(220 80% 70%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}
        >
          ResumeStudio
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-2 text-sm text-white/60 font-medium"
        >
          AI-Powered Resume Generator
        </motion.p>
      </motion.div>

      {/* Modern loading indicator */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 z-10"
      >
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scaleY: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
              className="w-1 h-6 rounded-full"
              style={{
                background: "linear-gradient(180deg, hsl(260 80% 70%), hsl(220 80% 60%))"
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Bottom branding */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-xs text-white/30 font-medium z-10"
      >
        Crafted with ❤️ for job seekers
      </motion.p>
    </motion.div>
  );
}
