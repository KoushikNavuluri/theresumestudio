import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PulseRingProps {
  children: ReactNode;
  className?: string;
  ringColor?: string;
  active?: boolean;
}

export function PulseRing({ 
  children, 
  className = "", 
  ringColor = "bg-primary/30",
  active = true 
}: PulseRingProps) {
  return (
    <div className={`relative ${className}`}>
      {active && (
        <>
          <motion.div
            className={`absolute inset-0 rounded-full ${ringColor}`}
            animate={{
              scale: [1, 1.4, 1.8],
              opacity: [0.4, 0.2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          <motion.div
            className={`absolute inset-0 rounded-full ${ringColor}`}
            animate={{
              scale: [1, 1.4, 1.8],
              opacity: [0.4, 0.2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.5,
            }}
          />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
