import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Sparkles
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  credits: number;
  bonus_credits: number;
  plan: string;
  plan_credits_used: number;
  credits_reset_at: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('credits, bonus_credits, plan, plan_credits_used, credits_reset_at')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfileData(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
    navigate("/auth");
  };

  const getPlanCredits = (plan: string) => {
    switch (plan) {
      case 'pro': return 100;
      case 'premium': return 500;
      default: return 10;
    }
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

  if (loading || loadingProfile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  const totalCredits = (profileData?.credits || 0) + (profileData?.bonus_credits || 0);
  const planCredits = getPlanCredits(profileData?.plan || 'free');
  const usedCredits = profileData?.plan_credits_used || 0;
  const remainingPlanCredits = Math.max(0, planCredits - usedCredits);

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
          {user && profileData && (
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
                    {getPlanBadge(profileData.plan)}
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
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
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
                      <span className="font-semibold">{profileData.bonus_credits}</span>
                    </div>
                  </div>

                  {profileData.plan === 'free' && (
                    <>
                      <Separator />
                      <motion.div whileTap={{ scale: 0.98 }}>
                        <Button 
                          className="w-full"
                          onClick={() => navigate("/upgrade")}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Upgrade for More Credits
                        </Button>
                      </motion.div>
                    </>
                  )}
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
