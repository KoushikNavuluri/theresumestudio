import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";

interface PdfPreviewPanelProps {
  pdfBase64: string | null;
  isLoading?: boolean;
}

export const PdfPreviewPanel = ({ pdfBase64, isLoading }: PdfPreviewPanelProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const pdfDataUrl = pdfBase64 ? `data:application/pdf;base64,${pdfBase64}` : null;

  const handleDownload = () => {
    if (!pdfDataUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfDataUrl;
    link.download = `resume-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              Exit Fullscreen
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
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            PDF Preview
          </CardTitle>
          {pdfDataUrl && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(true)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-lg border border-border">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Generating PDF...</p>
            </div>
          </div>
        ) : pdfDataUrl ? (
          <div className="relative">
            <iframe
              src={pdfDataUrl}
              className="w-full h-[400px] rounded-lg border border-border bg-white"
              title="Resume PDF Preview"
            />
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-lg border border-dashed border-border">
            <div className="text-center space-y-2">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Generate a resume to see the preview
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
