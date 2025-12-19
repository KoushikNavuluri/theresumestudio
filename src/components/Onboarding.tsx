import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Target, 
  Sparkles, 
  TrendingUp, 
  ArrowRight,
  CheckCircle2
} from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: FileText,
    title: "Welcome to ResumeStudio",
    description: "Your AI-powered companion for creating resumes that land interviews",
    gradient: "from-primary to-accent"
  },
  {
    icon: Target,
    title: "ATS Optimized",
    description: "Our AI analyzes job descriptions and tailors your resume to pass applicant tracking systems",
    gradient: "from-[hsl(var(--success))] to-[hsl(160_70%_45%)]"
  },
  {
    icon: TrendingUp,
    title: "Real-Time Analytics",
    description: "Get instant feedback on your resume's ATS score and keyword match percentage",
    gradient: "from-[hsl(var(--chart-4))] to-[hsl(25_90%_55%)]"
  },
  {
    icon: Sparkles,
    title: "Ready to Start?",
    description: "Paste a job description and let AI create your perfect resume in seconds",
    gradient: "from-accent to-primary"
  }
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      localStorage.setItem("onboarding-complete", "true");
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding-complete", "true");
    onComplete();
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[200] bg-background flex flex-col"
    >
      {/* Skip button */}
      {!isLastSlide && (
        <div className="absolute top-6 right-6 safe-area-top">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-8 shadow-lg`}
              style={{ boxShadow: `0 20px 60px -15px hsl(var(--primary) / 0.4)` }}
            >
              <Icon className="w-12 h-12 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-2xl font-bold text-foreground mb-3"
            >
              {slide.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground leading-relaxed"
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-8 safe-area-bottom">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? "w-8 bg-primary" 
                  : index < currentSlide 
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleNext}
          size="lg"
          className="w-full gap-2 h-14 text-base font-semibold"
        >
          {isLastSlide ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Get Started
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
