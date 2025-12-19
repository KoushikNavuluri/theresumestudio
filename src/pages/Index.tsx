import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { JobDescriptionPanel } from "@/components/JobDescriptionPanel";
import { ResumePreviewToggle } from "@/components/ResumePreviewToggle";
import { ResumeAnalytics } from "@/components/ResumeAnalytics";
import { Greeting } from "@/components/Greeting";
import { useAuth } from "@/hooks/useAuth";
import { useResumes } from "@/hooks/useResumes";
import { useHaptics } from "@/hooks/useHaptics";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageTransition, staggerContainer, fadeInUp } from "@/components/animations/PageTransition";
import { FloatingParticles } from "@/components/animations/FloatingParticles";
import { Save, Sparkles, Zap, Target, FileText, TrendingUp } from "lucide-react";

interface AnalyticsData {
  atsScore: number;
  keywordMatch: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveResume } = useResumes();
  const haptics = useHaptics();
  const { notifyResumeComplete, requestPermission } = usePushNotifications();
  
  const [jobDescription, setJobDescription] = useState("");
  const [latexCode, setLatexCode] = useState("");
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [status, setStatus] = useState<{ message: string; type: "idle" | "loading" | "success" | "error" }>({
    message: "",
    type: "idle",
  });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Check for resume to load from saved page
  useEffect(() => {
    const savedResume = sessionStorage.getItem("loadResume");
    if (savedResume) {
      try {
        const resume = JSON.parse(savedResume);
        if (resume.job_description) setJobDescription(resume.job_description);
        if (resume.latex_code) {
          setLatexCode(resume.latex_code);
          setHasGenerated(true);
        }
        if (resume.pdf_url) setDownloadUrl(resume.pdf_url);
        setStatus({ message: "Resume loaded successfully.", type: "success" });
        sessionStorage.removeItem("loadResume");
      } catch (e) {
        console.error("Failed to load resume from session storage");
      }
    }
  }, []);

  const analyzeResume = async (latex: string, jobDesc: string) => {
    setIsAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('analyze-resume', {
        body: { latex_code: latex, job_description: jobDesc }
      });

      if (response.data?.success) {
        setAnalytics({
          atsScore: response.data.atsScore,
          keywordMatch: response.data.keywordMatch,
          matchedKeywords: response.data.matchedKeywords || [],
          missingKeywords: response.data.missingKeywords || [],
          suggestions: response.data.suggestions || []
        });
      }
    } catch (e) {
      console.error('Analytics error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setStatus({ message: "Please paste a job description.", type: "error" });
      haptics.errorFeedback();
      return;
    }

    haptics.mediumTap();
    
    // Request notification permission on first generate
    requestPermission();

    setIsGenerating(true);
    setStatus({ message: "Generating optimized LaTeX resume… This can take up to ~2 minutes.", type: "loading" });
    setLatexCode("");
    setPdfBase64(null);
    setDownloadUrl(null);
    setAnalytics(null);
    setHasGenerated(false);

    try {
      // Step 1: Optimize resume using AI
      const optimizeResponse = await supabase.functions.invoke('optimize-resume', {
        body: { job_description: jobDescription }
      });

      if (optimizeResponse.error) {
        throw new Error(optimizeResponse.error.message || 'Failed to optimize resume');
      }

      const { latex_code } = optimizeResponse.data;
      
      if (!latex_code) {
        throw new Error('No LaTeX code generated');
      }

      setLatexCode(latex_code);
      setHasGenerated(true);
      setStatus({ message: "LaTeX generated! Converting to PDF & analyzing…", type: "loading" });
      setIsConvertingPdf(true);

      // Step 2: Convert LaTeX to PDF and analyze in parallel
      const [convertResponse] = await Promise.all([
        supabase.functions.invoke('convert-latex', { body: { latex_code } }),
        analyzeResume(latex_code, jobDescription)
      ]);

      setIsConvertingPdf(false);

      if (convertResponse.error) {
        setStatus({ message: "LaTeX generated! PDF conversion failed.", type: "success" });
        console.error('PDF conversion error:', convertResponse.error);
      } else if (convertResponse.data?.success && convertResponse.data?.pdf_base64) {
        setPdfBase64(convertResponse.data.pdf_base64);
        setDownloadUrl(`data:application/pdf;base64,${convertResponse.data.pdf_base64}`);
        setStatus({ message: "Success! Resume optimized and analyzed.", type: "success" });
        
        // Success feedback and notification
        haptics.successFeedback();
        notifyResumeComplete();
      } else {
        setStatus({ message: `LaTeX generated! PDF error: ${convertResponse.data?.error || 'Unknown error'}`, type: "success" });
      }

    } catch (error) {
      console.error('Generation error:', error);
      setStatus({ 
        message: error instanceof Error ? error.message : "Failed to generate resume", 
        type: "error" 
      });
      haptics.errorFeedback();
      setIsConvertingPdf(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setJobDescription("");
    setLatexCode("");
    setPdfBase64(null);
    setStatus({ message: "", type: "idle" });
    setDownloadUrl(null);
    setAnalytics(null);
    setHasGenerated(false);
  };

  const handleSaveResume = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your resumes.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!latexCode) {
      toast({
        title: "No resume to save",
        description: "Generate a resume first before saving.",
        variant: "destructive",
      });
      return;
    }

    // Generate AI title
    let title = `Resume - ${new Date().toLocaleDateString()}`;
    
    try {
      const titleResponse = await supabase.functions.invoke('generate-title', {
        body: { job_description: jobDescription }
      });
      
      if (titleResponse.data?.title) {
        title = titleResponse.data.title;
      }
    } catch (e) {
      console.log('Using default title');
    }

    const result = await saveResume(title, jobDescription, latexCode, downloadUrl || undefined);

    if (result) {
      toast({
        title: "Resume saved!",
        description: `Saved as "${title}"`,
      });
    } else {
      toast({
        title: "Save failed",
        description: "Failed to save resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 py-6 relative">
          {/* Floating particles background */}
          <FloatingParticles count={8} />
          
          {/* Greeting */}
          <Greeting />
          
          {/* Hero Section */}
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="text-center mb-8"
          >
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-medium text-primary mb-4"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="h-3.5 w-3.5" />
              </motion.div>
              AI-Powered Resume Optimization
            </motion.div>
            <motion.h1 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-foreground mb-3"
            >
              Land Your Dream Job
            </motion.h1>
            <motion.p 
              variants={fadeInUp}
              className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base"
            >
              Paste a job description and let AI optimize your resume for maximum ATS compatibility
            </motion.p>
          </motion.div>

          {/* Features Pills */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {[
              { icon: Target, label: "ATS Optimized", color: "text-primary" },
              { icon: TrendingUp, label: "Real-time Analytics", color: "text-[hsl(var(--success))]" },
              { icon: FileText, label: "PDF Export", color: "text-accent" },
            ].map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-card rounded-full border border-border text-xs cursor-default"
              >
                <feature.icon className={`h-3.5 w-3.5 ${feature.color}`} />
                {feature.label}
              </motion.div>
            ))}
          </motion.div>

          {/* Main content */}
          {!hasGenerated ? (
            // Initial state - just job description panel centered
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              <JobDescriptionPanel
                value={jobDescription}
                onChange={setJobDescription}
                onGenerate={handleGenerate}
                onClear={handleClear}
                isGenerating={isGenerating}
                status={status}
                downloadUrl={downloadUrl}
              />
              
              {/* Quick tips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.01 }}
              >
                <Card className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/10">
                  <div className="flex items-start gap-3">
                    <motion.div
                      animate={{ 
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Pro Tip</h4>
                      <p className="text-xs text-muted-foreground">
                        Paste the complete job description including requirements and responsibilities for best ATS optimization results. The AI will tailor your resume with relevant keywords.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          ) : (
            // After generation - full layout with preview and analytics
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4"
            >
              {/* Job Description - Narrower on large screens */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-4"
              >
                <JobDescriptionPanel
                  value={jobDescription}
                  onChange={setJobDescription}
                  onGenerate={handleGenerate}
                  onClear={handleClear}
                  isGenerating={isGenerating}
                  status={status}
                  downloadUrl={downloadUrl}
                />
              </motion.div>
              
              {/* Preview Toggle - Main area */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-5 space-y-4"
              >
                <ResumePreviewToggle 
                  latexCode={latexCode}
                  pdfBase64={pdfBase64}
                  isLoading={isConvertingPdf}
                />
                
                {latexCode && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={handleSaveResume} 
                      className="w-full gap-2"
                      size="lg"
                    >
                      <Save className="h-4 w-4" />
                      {user ? "Save Resume" : "Sign in to Save"}
                    </Button>
                  </motion.div>
                )}
              </motion.div>

              {/* Analytics Panel */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-3"
              >
                <ResumeAnalytics 
                  analytics={analytics}
                  isLoading={isAnalyzing}
                />
              </motion.div>
            </motion.div>
          )}
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default Index;
