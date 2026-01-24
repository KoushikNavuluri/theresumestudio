import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { History, Eye, RotateCcw, ChevronDown, ChevronUp, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ResumeVersion } from "@/hooks/useResumeVersions";

interface VersionHistoryPanelProps {
  versions: ResumeVersion[];
  loading: boolean;
  currentLatex: string | null;
  onRevert: (version: ResumeVersion) => void;
}

export function VersionHistoryPanel({ 
  versions, 
  loading, 
  currentLatex,
  onRevert 
}: VersionHistoryPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [compareVersion, setCompareVersion] = useState<ResumeVersion | null>(null);
  const [previewVersion, setPreviewVersion] = useState<ResumeVersion | null>(null);

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return null;
  }

  // Simple diff: count changed lines
  const getDiffStats = (oldCode: string, newCode: string) => {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    
    let added = 0;
    let removed = 0;
    
    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      if (oldLines[i] !== newLines[i]) {
        if (i >= oldLines.length) added++;
        else if (i >= newLines.length) removed++;
        else { added++; removed++; }
      }
    }
    
    return { added, removed };
  };

  return (
    <>
      <Card className="bg-card/80 backdrop-blur-sm border-border overflow-hidden">
        <CardHeader 
          className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Version History
              <Badge variant="secondary" className="text-xs">
                {versions.length}
              </Badge>
            </CardTitle>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0">
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {versions.map((version, index) => {
                      const isLatest = index === 0;
                      const diffStats = currentLatex && !isLatest 
                        ? getDiffStats(version.latex_code, currentLatex) 
                        : null;
                      
                      return (
                        <motion.div
                          key={version.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                v{version.version_number}
                              </span>
                              {isLatest && (
                                <Badge variant="default" className="text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                            {diffStats && (
                              <div className="flex gap-2 mt-1">
                                {diffStats.added > 0 && (
                                  <span className="text-xs text-green-500">+{diffStats.added}</span>
                                )}
                                {diffStats.removed > 0 && (
                                  <span className="text-xs text-red-500">-{diffStats.removed}</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => setPreviewVersion(version)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {!isLatest && currentLatex && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setCompareVersion(version)}
                                >
                                  <GitCompare className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => onRevert(version)}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Version {previewVersion?.version_number} Preview</DialogTitle>
            <DialogDescription>
              Created {previewVersion && format(new Date(previewVersion.created_at), "MMM d, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] rounded-md border bg-muted/30 p-4">
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {previewVersion?.latex_code}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={!!compareVersion} onOpenChange={() => setCompareVersion(null)}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
            <DialogDescription>
              Version {compareVersion?.version_number} vs Current
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 h-[60vh]">
            <div className="space-y-2">
              <Badge variant="secondary">v{compareVersion?.version_number} (Old)</Badge>
              <ScrollArea className="h-[calc(60vh-40px)] rounded-md border bg-muted/30 p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {compareVersion?.latex_code}
                </pre>
              </ScrollArea>
            </div>
            <div className="space-y-2">
              <Badge variant="default">Current</Badge>
              <ScrollArea className="h-[calc(60vh-40px)] rounded-md border bg-muted/30 p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {currentLatex}
                </pre>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
