import { FileText } from "lucide-react";

export function Header() {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-lg bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-glow)]">
          <FileText className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            ResumeStudio
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate ATS-optimized LaTeX resumes from job descriptions
          </p>
        </div>
      </div>
      
      <div className="sm:ml-auto">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground">
          1-hour auto cleanup
        </span>
      </div>
    </header>
  );
}
