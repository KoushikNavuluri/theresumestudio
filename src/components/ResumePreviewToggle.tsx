import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Code, 
  Download, 
  Maximize2, 
  Minimize2,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";

interface ResumePreviewToggleProps {
  latexCode: string;
  pdfBase64: string | null;
  isLoading?: boolean;
}

export function ResumePreviewToggle({ latexCode, pdfBase64, isLoading }: ResumePreviewToggleProps) {
  const [activeTab, setActiveTab] = useState<"pdf" | "latex">("pdf");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const pdfDataUrl = pdfBase64 ? `data:application/pdf;base64,${pdfBase64}` : null;

  const handleDownload = () => {
    if (!pdfDataUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfDataUrl;
    link.download = `resume-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("PDF downloaded!");
  };

  const handleCopy = async () => {
    if (!latexCode) return;
    
    try {
      await navigator.clipboard.writeText(latexCode);
      setCopied(true);
      toast.success("LaTeX copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Fullscreen mode
  if (isFullscreen && pdfDataUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume Preview
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
              <Minimize2 className="h-4 w-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
        <div className="flex-1 p-4">
          <iframe
            src={pdfDataUrl}
            className="w-full h-full rounded-lg border border-border"
            title="Resume PDF Preview"
          />
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Resume Output
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeTab === "pdf" && pdfDataUrl && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFullscreen(true)}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
            {activeTab === "latex" && latexCode && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-[hsl(var(--success))]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pdf" | "latex")}>
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="pdf" className="text-xs gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              PDF Preview
            </TabsTrigger>
            <TabsTrigger value="latex" className="text-xs gap-1.5">
              <Code className="h-3.5 w-3.5" />
              LaTeX Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="mt-0">
            {isLoading ? (
              <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-lg border border-border">
                <div className="text-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Generating PDF...</p>
                </div>
              </div>
            ) : pdfDataUrl ? (
              <iframe
                src={pdfDataUrl}
                className="w-full h-[400px] rounded-lg border border-border bg-background"
                title="Resume PDF Preview"
              />
            ) : (
              <div className="h-[400px] flex items-center justify-center bg-muted/10 rounded-lg border border-dashed border-border">
                <div className="text-center space-y-2">
                  <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    PDF will appear here after generation
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="latex" className="mt-0">
            <div className="h-[400px] overflow-auto bg-muted/30 rounded-lg border border-border p-4 font-mono text-xs leading-relaxed">
              {latexCode ? (
                <pre className="text-foreground/80 whitespace-pre-wrap break-all">
                  {latexCode}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Code className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      LaTeX code will appear here after generation
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
