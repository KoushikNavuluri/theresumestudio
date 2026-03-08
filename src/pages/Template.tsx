import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useTemplates, Template } from "@/hooks/useTemplates";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageTransition, fadeInUp } from "@/components/animations/PageTransition";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileCode, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  Star,
  Loader2,
  MessageSquare,
  Settings,
  Wand2
} from "lucide-react";
import { ResumeChatbot } from "@/components/ResumeChatbot";
import { AdvancedTemplateManager } from "@/components/AdvancedTemplateManager";

const TemplatePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeMode, setActiveMode] = useState<"ai" | "advanced">("ai");

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <AppLayout>
        <PageTransition>
          <div className="max-w-4xl mx-auto px-4 py-6">
            <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-[image:var(--gradient-primary)] flex items-center justify-center"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <FileCode className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Resume Builder</h1>
                <p className="text-sm text-muted-foreground">
                  Create and manage your professional resumes
                </p>
              </div>
            </motion.div>
            
            <Card className="p-12 text-center">
              <FileCode className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Sign In Required</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please sign in to access the resume builder
              </p>
              <Button onClick={() => navigate("/auth")} className="gap-2">
                Sign In
              </Button>
            </Card>
          </div>
        </PageTransition>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageTransition>
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Header */}
          <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-lg shadow-primary/20"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Wand2 className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Resume Builder</h1>
                <p className="text-sm text-muted-foreground">
                  {activeMode === "ai" ? "Let AI guide you to a perfect resume" : "Full control over your resume templates"}
                </p>
              </div>
            </div>

            <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as any)} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-muted/50 backdrop-blur-sm border border-border">
                <TabsTrigger value="ai" className="gap-2 rounded-md">
                  <MessageSquare className="h-4 w-4" />
                  AI Mode
                </TabsTrigger>
                <TabsTrigger value="advanced" className="gap-2 rounded-md">
                  <Settings className="h-4 w-4" />
                  Advanced Mode
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          <Tabs value={activeMode} className="w-full">
            <TabsContent value="ai" className="mt-0 border-none p-0 outline-none">
              <ResumeChatbot />
            </TabsContent>
            <TabsContent value="advanced" className="mt-0 border-none p-0 outline-none">
              <AdvancedTemplateManager />
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default TemplatePage;
