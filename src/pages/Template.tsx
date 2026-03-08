import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageTransition, fadeInUp } from "@/components/animations/PageTransition";
import { AIModeChat } from "@/components/template/AIModeChat";
import { AdvancedModeEditor } from "@/components/template/AdvancedModeEditor";
import { FileCode, Sparkles, Code2 } from "lucide-react";

const TemplatePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();



  return (
    <AppLayout>
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6">
            <motion.div
              className="w-12 h-12 rounded-2xl bg-[image:var(--gradient-primary)] flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <FileCode className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Templates</h1>
              <p className="text-sm text-muted-foreground">Build or customize your resume templates</p>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="ai" className="flex-1 gap-2">
                <Sparkles className="h-4 w-4" />
                AI Mode
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1 gap-2">
                <Code2 className="h-4 w-4" />
                Advanced Mode
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai">
              <AIModeChat />
            </TabsContent>

            <TabsContent value="advanced">
              <AdvancedModeEditor />
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default TemplatePage;
