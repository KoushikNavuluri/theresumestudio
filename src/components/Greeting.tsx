import { motion } from "framer-motion";
import { Sun, Moon, Sunrise, Sunset, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Greeting() {
  const { user } = useAuth();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return { text: "Good Morning", icon: Sunrise, emoji: "☀️" };
    } else if (hour >= 12 && hour < 17) {
      return { text: "Good Afternoon", icon: Sun, emoji: "🌤️" };
    } else if (hour >= 17 && hour < 21) {
      return { text: "Good Evening", icon: Sunset, emoji: "🌅" };
    } else {
      return { text: "Good Night", icon: Moon, emoji: "🌙" };
    }
  };

  const getUserName = () => {
    if (!user) return null;
    
    // Try to get name from user metadata
    const metadata = user.user_metadata;
    if (metadata?.full_name) return metadata.full_name.split(' ')[0];
    if (metadata?.name) return metadata.name.split(' ')[0];
    
    // Fallback to email prefix
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return null;
  };

  const greeting = getGreeting();
  const Icon = greeting.icon;
  const userName = getUserName();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="text-center mb-2"
    >
      <motion.div 
        className="inline-flex items-center gap-2 mb-2"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 3 
          }}
          className="p-2 rounded-full bg-primary/10"
        >
          <Icon className="h-6 w-6 text-primary" />
        </motion.div>
        <span className="text-3xl">{greeting.emoji}</span>
      </motion.div>
      
      <motion.h2 
        className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto]"
        animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
      >
        {greeting.text}{userName && `, ${userName}`}
        <motion.span 
          className="inline-block ml-1"
          animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
        >
          👋
        </motion.span>
      </motion.h2>
      
      {user && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-sm mt-1 flex items-center justify-center gap-1"
        >
          <Sparkles className="h-3 w-3" />
          Ready to create your perfect resume?
        </motion.p>
      )}
    </motion.div>
  );
}
