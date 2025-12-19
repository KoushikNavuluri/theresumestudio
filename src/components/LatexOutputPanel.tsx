import { useState } from "react";
import { Copy, Check, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LatexOutputPanelProps {
  latexCode: string;
}

export function LatexOutputPanel({ latexCode }: LatexOutputPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!latexCode || latexCode === "") return;
    
    try {
      await navigator.clipboard.writeText(latexCode);
      setCopied(true);
      toast.success("LaTeX copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-[var(--shadow-card)] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            LaTeX Code
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={!latexCode}
          className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-[hsl(var(--success))]" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>
      
      <div className="flex-1 min-h-[240px] sm:min-h-[320px] max-h-[500px] overflow-auto bg-input border border-border rounded-lg p-4 font-mono text-sm leading-relaxed">
        {latexCode ? (
          <pre className="text-[hsl(210_80%_80%)] whitespace-pre-wrap break-all">
            {latexCode}
          </pre>
        ) : (
          <span className="text-muted-foreground">No output yet.</span>
        )}
      </div>
    </div>
  );
}
