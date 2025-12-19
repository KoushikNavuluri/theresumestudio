import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-[image:var(--gradient-bg)] pointer-events-none" />
      
      <main className={`relative z-10 ${showNav ? "pb-24" : ""}`}>
        {children}
      </main>
      
      {showNav && <BottomNav />}
    </div>
  );
}
