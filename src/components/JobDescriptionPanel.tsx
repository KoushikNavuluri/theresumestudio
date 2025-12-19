import { Loader2, Download, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusMessage } from "@/components/StatusMessage";

interface JobDescriptionPanelProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onClear: () => void;
  isGenerating: boolean;
  status: { message: string; type: "idle" | "loading" | "success" | "error" };
  downloadUrl: string | null;
}

export function JobDescriptionPanel({
  value,
  onChange,
  onGenerate,
  onClear,
  isGenerating,
  status,
  downloadUrl,
}: JobDescriptionPanelProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-[var(--shadow-card)]">
      <label className="block text-sm font-medium text-muted-foreground mb-3">
        Paste Job Description
      </label>
      
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the complete job description here..."
        className="min-h-[200px] sm:min-h-[240px] resize-y bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
      />
      
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="bg-[image:var(--gradient-primary)] hover:opacity-90 text-primary-foreground font-semibold shadow-[var(--shadow-glow)] transition-all hover:shadow-[0_0_60px_hsl(225_73%_67%_/_0.25)]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={onClear}
          className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>
        
        {downloadUrl && (
          <a
            href={downloadUrl}
            download
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-input text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </a>
        )}
      </div>
      
      <StatusMessage status={status} />
    </div>
  );
}
