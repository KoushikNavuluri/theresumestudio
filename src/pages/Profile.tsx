import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageTransition, staggerContainer, fadeInUp } from "@/components/animations/PageTransition";
import { 
  User, 
  Mail, 
  LogOut, 
  Coins,
  Gift,
  Crown,
  Sparkles,
  MessageCircle,
  TicketCheck,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { creditsData, loading: loadingCredits, totalCredits, planCredits, remainingPlanCredits, bonusCredits, plan } = useCredits();
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
    navigate("/auth");
  };

  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) {
      toast({
        title: "Enter a code",
        description: "Please enter a valid promo code.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to redeem codes.",
        variant: "destructive",
      });
      return;
    }

    setIsRedeeming(true);

    try {
      // Check if code exists and is valid
      const { data: codeData, error: codeError } = await supabase
        .from('bonus_codes')
        .select('*')
        .eq('code', redeemCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (codeError || !codeData) {
        toast({
          title: "Invalid code",
          description: "This code doesn't exist or has expired.",
          variant: "destructive",
        });
        return;
      }

      // Check if code has reached max uses
      if (codeData.uses >= codeData.max_uses) {
        toast({
          title: "Code expired",
          description: "This code has reached its maximum usage limit.",
          variant: "destructive",
        });
        return;
      }

      // Check if user already redeemed this code
      const { data: existingRedemption } = await supabase
        .from('redeemed_codes')
        .select('id')
        .eq('user_id', user.id)
        .eq('bonus_code_id', codeData.id)
        .single();

      if (existingRedemption) {
        toast({
          title: "Already redeemed",
          description: "You've already used this code.",
          variant: "destructive",
        });
        return;
      }

      // Add bonus credits to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          bonus_credits: (creditsData?.bonus_credits || 0) + codeData.credits 
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Record the redemption
      await supabase
        .from('redeemed_codes')
        .insert({
          user_id: user.id,
          bonus_code_id: codeData.id,
          credits_awarded: codeData.credits
        });

      // Update code usage count (this might fail due to RLS, but that's ok)
      await supabase
        .from('bonus_codes')
        .update({ uses: codeData.uses + 1 })
        .eq('id', codeData.id);

      toast({
        title: "Code redeemed!",
        description: `You've received ${codeData.credits} bonus credits!`,
      });

      setRedeemCode("");
    } catch (error) {
      console.error('Redeem error:', error);
      toast({
        title: "Error",
        description: "Failed to redeem code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleContactOwner = () => {
    window.open('mailto:support@example.com?subject=Request%20for%20More%20Credits', '_blank');
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <Badge className="bg-primary text-primary-foreground"><Crown className="h-3 w-3 mr-1" />Pro</Badge>;
      case 'premium':
        return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"><Sparkles className="h-3 w-3 mr-1" />Premium</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  if (loading || loadingCredits) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageTransition>
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-lg mx-auto px-4 py-6 space-y-6"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="text-center pt-4">
            <motion.div 
              className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <User className="w-10 h-10 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground text-sm">Manage your account and credits</p>
          </motion.div>

          {/* Credits Card */}
          {user && creditsData && (
            <motion.div variants={fadeInUp}>
              <Card className="bg-card/80 backdrop-blur-sm border-border overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Coins className="h-5 w-5 text-primary" />
                      </motion.div>
                      Credits
                    </CardTitle>
                    {getPlanBadge(plan)}
                  </div>
                  <CardDescription>
                    Your available credits for resume optimization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Total Credits Display */}
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <motion.div 
                      className="text-4xl font-bold text-primary"
                      key={totalCredits}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      {totalCredits}
                    </motion.div>
                    <p className="text-sm text-muted-foreground mt-1">Total Credits Available</p>
                  </div>

                  {/* Credits Breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Crown className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Plan Credits</p>
                          <p className="text-xs text-muted-foreground">
                            {remainingPlanCredits} of {planCredits} remaining
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold">{remainingPlanCredits}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Gift className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Bonus Credits</p>
                          <p className="text-xs text-muted-foreground">From promo codes</p>
                        </div>
                      </div>
                      <motion.span 
                        className="font-semibold"
                        key={bonusCredits}
                        initial={{ scale: 1.3, color: "hsl(var(--primary))" }}
                        animate={{ scale: 1, color: "inherit" }}
                      >
                        {bonusCredits}
                      </motion.span>
                    </div>
                  </div>

                  <Separator />

                  {/* Redeem Code Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TicketCheck className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Redeem Promo Code</span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={redeemCode}
                        onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                        className="uppercase"
                        disabled={isRedeeming}
                      />
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button 
                          onClick={handleRedeemCode}
                          disabled={isRedeeming || !redeemCode.trim()}
                        >
                          {isRedeeming ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Redeem"
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Owner */}
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={handleContactOwner}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Owner for More Credits
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Account Card */}
          <motion.div variants={fadeInUp}>
            <Card className="bg-card/80 backdrop-blur-sm border-border overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Mail className="h-5 w-5 text-primary" />
                  </motion.div>
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user ? (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm font-medium">{user.email}</p>
                    </div>
                    <Separator />
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </motion.div>
                  </>
                ) : (
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button 
                      className="w-full"
                      onClick={() => navigate("/auth")}
                    >
                      Sign In to Your Account
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </PageTransition>
    </AppLayout>
  );
}
