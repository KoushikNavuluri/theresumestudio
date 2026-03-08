import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";

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
  MessageCircle,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
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
      // Call secure edge function for atomic code redemption
      const { data, error } = await supabase.functions.invoke('redeem-bonus-code', {
        body: { code: redeemCode.trim() }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Error",
          description: "Failed to redeem code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!data.success) {
        toast({
          title: "Unable to redeem",
          description: data.error || "This code is invalid or has already been used.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Code redeemed!",
        description: `You've received ${data.credits_awarded} bonus credits!`,
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-muted-foreground font-medium text-lg">Loading profile...</div>
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
