import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { JobDescriptionPanel } from "@/components/JobDescriptionPanel";
import { LatexOutputPanel } from "@/components/LatexOutputPanel";
import { PdfPreviewPanel } from "@/components/PdfPreviewPanel";
import { Footer } from "@/components/Footer";
import { SavedResumes } from "@/components/SavedResumes";
import { useAuth } from "@/hooks/useAuth";
import { useResumes } from "@/hooks/useResumes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Save, User } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { resumes, saveResume } = useResumes();
  
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

    const title = `Resume - ${new Date().toLocaleDateString()}`;
    const result = await saveResume(title, jobDescription, latexCode, downloadUrl || undefined);

    if (result) {
      toast({
        title: "Resume saved!",
        description: "Your resume has been saved to your account.",
      });
    } else {
      toast({
        title: "Save failed",
        description: "Failed to save resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLoadResume = (resume: { job_description: string | null; latex_code: string | null; pdf_url: string | null }) => {
    if (resume.job_description) setJobDescription(resume.job_description);
    if (resume.latex_code) setLatexCode(resume.latex_code);
    if (resume.pdf_url) setDownloadUrl(resume.pdf_url);
    setPdfBase64(null); // Clear preview as we only have URL
    setStatus({ message: "Resume loaded successfully.", type: "success" });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-[image:var(--gradient-bg)] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20">
        {/* Auth controls */}
        <div className="flex justify-end mb-4 gap-2">
          {authLoading ? (
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
        </div>

        <Header />
        
        {/* Main content - 3 column layout on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
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
                className="w-full"
                variant="secondary"
              >
                <Save className="h-4 w-4 mr-2" />
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

        {user && resumes.length > 0 && (
          <SavedResumes resumes={resumes} onLoadResume={handleLoadResume} />
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
