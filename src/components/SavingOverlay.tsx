import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, Save } from "lucide-react";

interface SavingOverlayProps {
  isVisible: boolean;
  status: "saving" | "success" | "idle";
}

export function SavingOverlay({ isVisible, status }: SavingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border border-border shadow-lg"
          >
            {status === "saving" && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="relative"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
                  <motion.div
                    className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <Save className="absolute inset-0 m-auto h-6 w-6 text-primary" />
                </motion.div>
                <div className="text-center">
                  <motion.p 
                    className="font-medium text-foreground"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Saving your resume...
                  </motion.p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please wait a moment
                  </p>
                </div>
              </>
            )}
            
            {status === "success" && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-[hsl(var(--success))]/20 flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Check className="h-8 w-8 text-[hsl(var(--success))]" />
                  </motion.div>
                </motion.div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Resume Saved!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your resume has been saved successfully
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
