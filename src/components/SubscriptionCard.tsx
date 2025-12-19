import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Zap, Sparkles, Gift, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";

export function SubscriptionCard() {
  const { profile, loading, refetch, totalCredits } = useProfile();
  const [bonusCode, setBonusCode] = useState("");
  const [redeemingCode, setRedeemingCode] = useState(false);

  const handleRedeemCode = async () => {
    if (!bonusCode.trim()) return;

    setRedeemingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-bonus-code", {
        body: { code: bonusCode },
      });

      if (error) throw error;

      toast({
        title: "Code redeemed!",
        description: data.message,
      });
      setBonusCode("");
      refetch();
    } catch (error: any) {
      toast({
        title: "Failed to redeem code",
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
    } finally {
      setRedeemingCode(false);
    }
  };

  const handleContactOwner = () => {
    window.open("mailto:support@resumestudio.com?subject=Request%20More%20Credits", "_blank");
  };

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const creditsRemaining = profile?.credits || 0;
  const creditsUsed = profile?.plan_credits_used || 0;
  const totalPlanCredits = creditsRemaining + creditsUsed;
  const usagePercent = totalPlanCredits > 0 ? (creditsUsed / totalPlanCredits) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Credits Display */}
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Your Credits
            </CardTitle>
            <Badge variant="secondary">
              {totalCredits} available
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Credits Used</span>
              <span className="font-medium">{creditsUsed} / {totalPlanCredits}</span>
            </div>
            <Progress value={100 - usagePercent} className="h-2" />
          </div>
          
          {profile?.bonus_credits > 0 && (
            <div className="flex items-center justify-between text-sm p-2 bg-primary/10 rounded-lg">
              <span className="flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-primary" />
                Bonus Credits
              </span>
              <span className="font-medium text-primary">{profile.bonus_credits}</span>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Available</span>
            <span className="text-xl font-bold text-primary">{totalCredits}</span>
          </div>
        </CardContent>
      </Card>

      {/* Bonus Code Redemption */}
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Redeem Bonus Code
          </CardTitle>
          <CardDescription>Have a promo code? Enter it below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter code"
              value={bonusCode}
              onChange={(e) => setBonusCode(e.target.value.toUpperCase())}
              className="uppercase"
            />
            <Button 
              onClick={handleRedeemCode} 
              disabled={!bonusCode.trim() || redeemingCode}
            >
              {redeemingCode ? "..." : "Redeem"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact for More Credits */}
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Need More Credits?
          </CardTitle>
          <CardDescription>Contact us to get additional credits</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleContactOwner} className="w-full" variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Contact Owner
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
