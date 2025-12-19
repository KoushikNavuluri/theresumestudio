import { useState } from "react";
import { Header } from "@/components/Header";
import { JobDescriptionPanel } from "@/components/JobDescriptionPanel";
import { LatexOutputPanel } from "@/components/LatexOutputPanel";
import { Footer } from "@/components/Footer";

const Index = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [latexCode, setLatexCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
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
    setStatus({ message: "Generating optimized LaTeX and PDF… This can take up to ~2 minutes.", type: "loading" });
    setLatexCode("");
    setDownloadUrl(null);

    // Simulate generation for now (will be connected to backend later)
    setTimeout(() => {
      const sampleLatex = `\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{fontawesome}
\\usepackage{lmodern}

\\hypersetup{
    colorlinks=true,
    linkcolor=black,
    urlcolor=black,
}

\\pagestyle{empty}

\\begin{document}

% Name
\\begin{center}
{\\huge \\textbf{YOUR NAME}}
\\end{center}

% Contact Info
\\begin{center}
\\small
\\faEnvelope\\ \\href{mailto:youremail@gmail.com}{youremail@gmail.com} \\quad
\\faPhone\\ 1234567890 \\quad
\\faGlobe\\ \\href{https://portfolio.com}{portfolio} \\quad
\\faLinkedin\\ \\href{https://linkedin.com/yourid}{LinkedIn} \\quad
\\faGithub\\ \\href{https://github.com/yourid}{Github}
\\end{center}

\\vspace{6pt}

% Professional Summary
\\noindent\\textbf{Professional Summary}
\\vspace{2pt}
\\hrule
\\vspace{6pt}
\\noindent
Full-stack developer with expertise in modern technologies...

\\end{document}`;

      setLatexCode(sampleLatex);
      setStatus({ message: "LaTeX generated! Connect backend for PDF generation.", type: "success" });
      setIsGenerating(false);
    }, 2000);
  };

  const handleClear = () => {
    setJobDescription("");
    setLatexCode("");
    setStatus({ message: "", type: "idle" });
    setDownloadUrl(null);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-[image:var(--gradient-bg)] pointer-events-none" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20">
        <Header />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
          <JobDescriptionPanel
            value={jobDescription}
            onChange={setJobDescription}
            onGenerate={handleGenerate}
            onClear={handleClear}
            isGenerating={isGenerating}
            status={status}
            downloadUrl={downloadUrl}
          />
          
          <LatexOutputPanel latexCode={latexCode} />
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
