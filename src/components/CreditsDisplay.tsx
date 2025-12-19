import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";

export function CreditsDisplay() {
  const { user } = useAuth();
  const { totalCredits, loading } = useCredits();

  if (!user || loading) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full"
    >
      <Coins className="h-4 w-4 text-primary" />
      <motion.span 
        key={totalCredits}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="text-sm font-semibold text-primary"
      >
        {totalCredits}
      </motion.span>
    </motion.div>
  );
}
