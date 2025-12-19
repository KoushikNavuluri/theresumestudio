import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-xs text-muted-foreground pointer-events-none">
      <span className="inline-flex items-center gap-1">
        Crafted with <Heart className="w-3 h-3 text-destructive fill-destructive" /> by Koushik Navuluri
      </span>
    </footer>
  );
}
