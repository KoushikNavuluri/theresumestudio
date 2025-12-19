import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Crown, Zap, Check, Sparkles, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Plan {
  id: "free" | "basic" | "pro";
  name: string;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    credits: 10,
    features: ["10 resume generations/month", "Basic templates", "PDF export"],
  },
  {
    id: "basic",
    name: "Basic",
    price: 99,
    credits: 100,
    features: ["100 resume generations/month", "All templates", "PDF export", "Priority support"],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 299,
    credits: 300,
    features: ["300 resume generations/month", "All templates", "PDF export", "Priority support", "Dark themes", "Analytics"],
  },
];

export function SubscriptionCard() {
  const { profile, loading, refetch, totalCredits } = useProfile();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [bonusCode, setBonusCode] = useState("");
  const [redeemingCode, setRedeemingCode] = useState(false);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (plan: Plan) => {
    if (plan.id === "free") return;
    
    setProcessingPlan(plan.id);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error("Failed to load payment gateway");
      }

      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-razorpay-order",
        { body: { plan: plan.id } }
      );

      if (orderError) throw orderError;

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ResumeStudio",
        description: `${plan.name} Plan Subscription`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            const { error: verifyError } = await supabase.functions.invoke(
              "verify-razorpay-payment",
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan: plan.id,
                },
              }
            );

            if (verifyError) throw verifyError;

            toast({
              title: "Subscription activated!",
              description: `You're now on the ${plan.name} plan with ${plan.credits} credits.`,
            });
            refetch();
          } catch (error: any) {
            toast({
              title: "Payment verification failed",
              description: error.message,
              variant: "destructive",
            });
          }
        },
        prefill: {
          email: profile?.email || "",
        },
        theme: {
          color: "#4f46e5",
        },
        // Enable UPI and other payment methods
        config: {
          display: {
            blocks: {
              utib: { // UPI Block
                name: "Pay using UPI",
                instruments: [
                  {
                    method: "upi",
                    flows: ["qr", "collect", "intent"]
                  }
                ]
              },
              other: { // Card, Netbanking, Wallet
                name: "Other Payment Methods",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" }
                ]
              }
            },
            sequence: ["block.utib", "block.other"],
            preferences: {
              show_default_blocks: false
            }
          }
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setProcessingPlan(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setProcessingPlan(null);
    }
  };

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

  const currentPlan = plans.find((p) => p.id === profile?.plan) || plans[0];
  const creditsUsed = profile?.plan_credits_used || 0;
  const planCredits = currentPlan.credits;
  const usagePercent = Math.min((creditsUsed / planCredits) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Current Plan & Credits */}
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Your Plan
            </CardTitle>
            <Badge variant={currentPlan.id === "pro" ? "default" : "secondary"}>
              {currentPlan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan Credits</span>
              <span className="font-medium">{planCredits - creditsUsed} / {planCredits}</span>
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

      {/* Upgrade Plans */}
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Upgrade Plan
          </CardTitle>
          <CardDescription>Get more credits and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {plans.filter(p => p.id !== "free").map((plan) => (
            <div
              key={plan.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                plan.popular
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{plan.name}</h3>
                    {plan.popular && (
                      <Badge variant="default" className="text-xs">Popular</Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold">
                    ₹{plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                </div>
                <Button
                  onClick={() => handleUpgrade(plan)}
                  disabled={processingPlan === plan.id || profile?.plan === plan.id}
                  variant={profile?.plan === plan.id ? "outline" : "default"}
                  size="sm"
                >
                  {processingPlan === plan.id
                    ? "Processing..."
                    : profile?.plan === plan.id
                    ? "Current"
                    : "Upgrade"}
                </Button>
              </div>
              <ul className="space-y-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
