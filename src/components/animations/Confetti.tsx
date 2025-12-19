import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  size: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
}

const colors = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142 76% 36%)", // success green
  "hsl(48 96% 53%)",  // gold
  "hsl(280 87% 65%)", // purple
  "hsl(199 89% 48%)", // blue
];

export function Confetti({ isActive, duration = 3000 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
        size: Math.random() * 8 + 4,
      }));
      setPieces(newPieces);
      setShow(true);

      // Hide after duration
      const timer = setTimeout(() => {
        setShow(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                opacity: 1,
                y: -20,
                x: `${piece.x}vw`,
                rotate: 0,
                scale: 0,
              }}
              animate={{
                opacity: [1, 1, 0],
                y: ["0vh", "100vh"],
                rotate: piece.rotation + 720,
                scale: [0, 1, 1, 0.5],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2.5 + Math.random(),
                delay: piece.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{
                position: "absolute",
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              }}
            />
          ))}
          
          {/* Sparkle bursts */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${10 + Math.random() * 30}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                ease: "easeOut",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L13.5 9.5L21 12L13.5 14.5L12 22L10.5 14.5L3 12L10.5 9.5L12 2Z"
                  fill="hsl(48 96% 53%)"
                />
              </svg>
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
