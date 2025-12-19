import { FileText, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function Header() {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
      <div className="flex items-center gap-3">
        <motion.div 
          className="w-12 h-12 rounded-2xl bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <motion.div
            animate={{ 
              rotateY: [0, 360],
            }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
          >
            <FileText className="w-6 h-6 text-primary-foreground" />
          </motion.div>
        </motion.div>
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
          >
            ResumeStudio
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground"
          >
            AI-powered ATS resume optimization
          </motion.p>
        </div>
      </div>
      
      <div className="sm:ml-auto hidden sm:block">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-3 w-3" />
          </motion.div>
          Powered by AI
        </motion.div>
      </div>
    </header>
  );
}
