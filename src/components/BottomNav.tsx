import { Home, FolderOpen, User, HelpCircle, FileCode, Shield, Key } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/useAdmin";

const baseNavItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: FileCode, label: "Template", path: "/template" },
  { icon: FolderOpen, label: "Saved", path: "/saved" },
  { icon: Key, label: "API", path: "/api" },
  { icon: User, label: "Profile", path: "/profile" },
];

const adminNavItem = { icon: Shield, label: "Admin", path: "/admin" };

export function BottomNav() {
  const location = useLocation();
  const { isAdmin, loading } = useAdmin();
  
  const navItems = isAdmin && !loading 
    ? [...baseNavItems, adminNavItem] 
    : baseNavItems;

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div
                  animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <item.icon className="h-5 w-5 relative z-10" />
                </motion.div>
                <span className="text-[10px] font-medium relative z-10">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
