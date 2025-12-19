import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Header } from "@/components/Header";
import { JobDescriptionPanel } from "@/components/JobDescriptionPanel";
import { LatexOutputPanel } from "@/components/LatexOutputPanel";
import { PdfPreviewPanel } from "@/components/PdfPreviewPanel";
import { useAuth } from "@/hooks/useAuth";
import { useResumes } from "@/hooks/useResumes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Save, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveResume } = useResumes();
  
  const [jobDescription, setJobDescription] = useState("");
  const [latexCode, setLatexCode] = useState("");
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: "idle" | "loading" | "success" | "error" }>({
    message: "",
    type: "idle",
  });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Check for resume to load from saved page
  useEffect(() => {
    const savedResume = sessionStorage.getItem("loadResume");
    if (savedResume) {
      try {
        const resume = JSON.parse(savedResume);
        if (resume.job_description) setJobDescription(resume.job_description);
        if (resume.latex_code) setLatexCode(resume.latex_code);
        if (resume.pdf_url) setDownloadUrl(resume.pdf_url);
        setStatus({ message: "Resume loaded successfully.", type: "success" });
        sessionStorage.removeItem("loadResume");
      } catch (e) {
        console.error("Failed to load resume from session storage");
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setStatus({ message: "Please paste a job description.", type: "error" });
      return;
    }

    setIsGenerating(true);
    setStatus({ message: "Generating optimized LaTeX resume… This can take up to ~2 minutes.", type: "loading" });
    setLatexCode("");
    setPdfBase64(null);
    setDownloadUrl(null);

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
      setStatus({ message: "LaTeX generated! Converting to PDF…", type: "loading" });
      setIsConvertingPdf(true);

      // Step 2: Convert LaTeX to PDF
      const convertResponse = await supabase.functions.invoke('convert-latex', {
        body: { latex_code }
      });

      setIsConvertingPdf(false);

      if (convertResponse.error) {
        setStatus({ message: "LaTeX generated successfully! PDF conversion failed.", type: "success" });
        console.error('PDF conversion error:', convertResponse.error);
      } else if (convertResponse.data?.success && convertResponse.data?.pdf_base64) {
        setPdfBase64(convertResponse.data.pdf_base64);
        setDownloadUrl(`data:application/pdf;base64,${convertResponse.data.pdf_base64}`);
        setStatus({ message: "Success! Resume optimized and PDF generated.", type: "success" });
      } else {
        setStatus({ message: `LaTeX generated! PDF error: ${convertResponse.data?.error || 'Unknown error'}`, type: "success" });
      }

    } catch (error) {
      console.error('Generation error:', error);
      setStatus({ 
        message: error instanceof Error ? error.message : "Failed to generate resume", 
        type: "error" 
      });
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Header />
        
        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          {/* Job Description Panel */}
          <div className="lg:col-span-1">
            <JobDescriptionPanel
              value={jobDescription}
              onChange={setJobDescription}
              onGenerate={handleGenerate}
              onClear={handleClear}
              isGenerating={isGenerating}
              status={status}
              downloadUrl={downloadUrl}
            />
          </div>
          
          {/* LaTeX Output Panel */}
          <div className="lg:col-span-1 space-y-4">
            <LatexOutputPanel latexCode={latexCode} />
            
            {latexCode && (
              <Button 
                onClick={handleSaveResume} 
                className="w-full gap-2"
                variant="secondary"
              >
                <Save className="h-4 w-4" />
                {user ? "Save Resume" : "Sign in to Save"}
              </Button>
            )}
          </div>

          {/* PDF Preview Panel */}
          <div className="lg:col-span-1">
            <PdfPreviewPanel 
              pdfBase64={pdfBase64} 
              isLoading={isConvertingPdf}
            />
          </div>
        </div>

        {/* Quick tips for mobile */}
        <div className="mt-8 lg:hidden">
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Pro Tip</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Paste the complete job description for best ATS optimization results. The AI will tailor your resume with relevant keywords.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
