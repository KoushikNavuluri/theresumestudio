import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hoverEffect?: boolean;
}

export function AnimatedCard({ 
  children, 
  className, 
  delay = 0,
  hoverEffect = true 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={hoverEffect ? { 
        y: -4, 
        transition: { duration: 0.2 } 
      } : undefined}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow",
        hoverEffect && "hover:shadow-lg",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// List item animation for staggered lists
export function AnimatedListItem({ 
  children, 
  index = 0,
  className 
}: { 
  children: ReactNode; 
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
