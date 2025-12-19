import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  showHeader?: boolean;
}

export function AppLayout({ children, showNav = true, showHeader = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-[image:var(--gradient-bg)] pointer-events-none" />

      {showHeader && (
        <header className="relative z-10 border-b border-border/40 bg-background/60 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-3">
            <ThemeSwitcher />
          </div>
        </header>
      )}

      <main className={`relative z-10 ${showNav ? "pb-24" : ""}`}>{children}</main>

      {showNav && <BottomNav />}
    </div>
  );
}

