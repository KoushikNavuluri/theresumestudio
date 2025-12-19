import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnalyticsSkeleton } from "@/components/ui/skeleton-shimmer";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Lightbulb,
  TrendingUp
} from "lucide-react";

interface ResumeAnalyticsProps {
  analytics: {
    atsScore: number;
    keywordMatch: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
  } | null;
  isLoading?: boolean;
}

export function ResumeAnalytics({ analytics, isLoading }: ResumeAnalyticsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[hsl(var(--success))]";
    if (score >= 60) return "text-[hsl(var(--chart-4))]";
    return "text-destructive";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-[hsl(var(--success))] to-[hsl(142_76%_50%)]";
    if (score >= 60) return "from-[hsl(var(--chart-4))] to-[hsl(45_90%_55%)]";
    return "from-destructive to-[hsl(0_84%_70%)]";
  };

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (!analytics) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Resume Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Generate a resume to see ATS analytics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Resume Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Score Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* ATS Score */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4 border border-border">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">ATS Score</span>
              <span className={`text-3xl font-bold ${getScoreColor(analytics.atsScore)}`}>
                {analytics.atsScore}%
              </span>
            </div>
            <div className="mt-2">
              <Progress 
                value={analytics.atsScore} 
                className="h-1.5"
              />
            </div>
          </div>

          {/* Keyword Match */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 p-4 border border-border">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">Keyword Match</span>
              <span className={`text-3xl font-bold ${getScoreColor(analytics.keywordMatch)}`}>
                {analytics.keywordMatch}%
              </span>
            </div>
            <div className="mt-2">
              <Progress 
                value={analytics.keywordMatch} 
                className="h-1.5"
              />
            </div>
          </div>
        </div>

        {/* Matched Keywords */}
        {analytics.matchedKeywords.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
              Matched Keywords
            </div>
            <div className="flex flex-wrap gap-1.5">
              {analytics.matchedKeywords.slice(0, 8).map((keyword, i) => (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="text-xs bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20"
                >
                  {keyword}
                </Badge>
              ))}
              {analytics.matchedKeywords.length > 8 && (
                <Badge variant="outline" className="text-xs">
                  +{analytics.matchedKeywords.length - 8} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Missing Keywords */}
        {analytics.missingKeywords.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              Missing Keywords
            </div>
            <div className="flex flex-wrap gap-1.5">
              {analytics.missingKeywords.slice(0, 6).map((keyword, i) => (
                <Badge 
                  key={i} 
                  variant="secondary"
                  className="text-xs bg-destructive/10 text-destructive border-destructive/20"
                >
                  {keyword}
                </Badge>
              ))}
              {analytics.missingKeywords.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{analytics.missingKeywords.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {analytics.suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5 text-[hsl(var(--chart-4))]" />
              Suggestions
            </div>
            <ul className="space-y-1.5">
              {analytics.suggestions.map((suggestion, i) => (
                <li key={i} className="text-xs text-muted-foreground pl-3 border-l-2 border-primary/30">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
