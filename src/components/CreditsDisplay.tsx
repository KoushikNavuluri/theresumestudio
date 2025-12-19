import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Coins, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CreditsDisplayProps {
  compact?: boolean;
}

export const CreditsDisplay = ({ compact = false }: CreditsDisplayProps) => {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();

  if (loading || !profile) return null;

  const totalCredits = profile.credits + profile.bonus_credits;
  const isLow = totalCredits < 5;

  if (compact) {
    return (
      <div 
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
          isLow 
            ? "bg-destructive/10 text-destructive hover:bg-destructive/20" 
            : "bg-primary/10 text-primary hover:bg-primary/20"
        }`}
        onClick={() => navigate("/profile")}
      >
        <Coins className="h-3.5 w-3.5" />
        <span>{totalCredits}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      isLow ? "bg-destructive/5 border-destructive/20" : "bg-card border-border"
    }`}>
      <div className={`p-2 rounded-full ${isLow ? "bg-destructive/10" : "bg-primary/10"}`}>
        <Coins className={`h-4 w-4 ${isLow ? "text-destructive" : "text-primary"}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{totalCredits} credits</p>
        <p className="text-xs text-muted-foreground">
          {isLow ? "Running low!" : `${profile.plan} plan`}
        </p>
      </div>
      {isLow && (
        <Button size="sm" variant="default" onClick={() => navigate("/profile")} className="gap-1">
          <Zap className="h-3 w-3" />
          Upgrade
        </Button>
      )}
    </div>
  );
};
