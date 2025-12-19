import { motion } from "framer-motion";
import { FileText, Sparkles, Zap } from "lucide-react";

export const Hero3DIcon = () => {
  return (
    <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-6" style={{ perspective: "1000px" }}>
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/40 to-accent/40 blur-2xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main 3D cube container */}
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{
          rotateY: [0, 15, -15, 0],
          rotateX: [-5, 10, -5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Front face */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent shadow-2xl border border-primary/20"
          style={{
            transformStyle: "preserve-3d",
            transform: "translateZ(20px)",
            backfaceVisibility: "hidden",
          }}
        >
          <motion.div
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <FileText className="w-16 h-16 md:w-20 md:h-20 text-primary-foreground drop-shadow-lg" />
          </motion.div>
        </motion.div>

        {/* Side face - right */}
        <div
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/80 to-accent/80"
          style={{
            transform: "rotateY(90deg) translateZ(60px)",
            backfaceVisibility: "hidden",
          }}
        />

        {/* Top face */}
        <div
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/60 to-accent/60"
          style={{
            transform: "rotateX(90deg) translateZ(60px)",
            backfaceVisibility: "hidden",
          }}
        />
      </motion.div>

      {/* Floating sparkles */}
      <motion.div
        className="absolute -top-2 -right-2"
        animate={{
          y: [0, -8, 0],
          rotate: [0, 180, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="p-2 rounded-full bg-accent/20 backdrop-blur-sm">
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
      </motion.div>

      {/* Floating zap */}
      <motion.div
        className="absolute -bottom-1 -left-2"
        animate={{
          y: [0, 6, 0],
          x: [0, -3, 0],
          rotate: [0, -15, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <div className="p-2 rounded-full bg-primary/20 backdrop-blur-sm">
          <Zap className="w-4 h-4 text-primary" />
        </div>
      </motion.div>

      {/* Orbiting dot */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/50"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          transformOrigin: "-40px center",
        }}
      />

      {/* Second orbiting dot */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-accent to-primary shadow-lg shadow-accent/50"
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          transformOrigin: "50px center",
        }}
      />
    </div>
  );
};
