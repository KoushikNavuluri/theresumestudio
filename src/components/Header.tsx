import { FileText, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-lg">
          <FileText className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            ResumeStudio
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered ATS resume optimization
          </p>
        </div>
      </div>
      
      <div className="sm:ml-auto hidden sm:block">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Sparkles className="h-3 w-3" />
          Powered by AI
        </div>
      </div>
    </header>
  );
}
