import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageTransition, staggerContainer, fadeInUp } from "@/components/animations/PageTransition";
import {
  User,
  Mail,
  LogOut,
  MessageCircle,
  Loader2,
  Heart,
  Code2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
    navigate("/auth");
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
            <p className="text-muted-foreground text-sm">Manage your account and preferences</p>
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

          {/* Developer Info */}
          <motion.div
            variants={fadeInUp}
            className="text-center pt-8 pb-4 relative"
          >
            <div className="absolute inset-x-0 top-0 flex justify-center opacity-10">
              <Separator className="w-1/2" />
            </div>

            <div className="inline-flex flex-col items-center gap-3 mt-6">
              <div className="p-2 rounded-xl bg-primary/5 border border-primary/10">
                <Code2 className="h-5 w-5 text-primary opacity-70" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center justify-center gap-1.5 text-foreground/90">
                  Crafted with
                  <span className="inline-block animate-heartbeat">
                    ❤️
                  </span>
                  for Py,
                </p>
                <p className="text-lg font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-flow">
                  Koushik Navuluri
                </p>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1 }}
                className="text-xs text-muted-foreground italic max-w-[250px] leading-relaxed"
              >
                "Empowering makers through elegant code and intelligent design."
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      </PageTransition>
    </AppLayout>
  );
}
