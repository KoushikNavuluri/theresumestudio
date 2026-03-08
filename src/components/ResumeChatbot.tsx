import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Send,
    User,
    Bot,
    Loader2,
    CheckCircle2,
    Sparkles,
    RotateCcw,
    FileText,
    Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTemplates } from "@/hooks/useTemplates";
import { toast } from "@/hooks/use-toast";

interface Message {
    id: string;
    role: "user" | "bot";
    content: string;
    timestamp: Date;
}

interface ResumeData {
    personalInfo: {
        name: string;
        email: string;
        phone: string;
        linkedin: string;
        portfolio: string;
    };
    experience: string;
    education: string;
    skills: string;
    projects: string;
    certifications: string;
}

const STEPS = [
    { id: "personal", label: "Personal Info" },
    { id: "experience", label: "Experience" },
    { id: "education", label: "Education" },
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    { id: "certifications", label: "Certifications" }
];

export const ResumeChatbot = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [resumeData, setResumeData] = useState<ResumeData>({
        personalInfo: { name: "", email: "", phone: "", linkedin: "", portfolio: "" },
        experience: "",
        education: "",
        skills: "",
        projects: "",
        certifications: ""
    });
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [isGeneratingInMode, setIsGeneratingInMode] = useState(false);
    const [generatedLatex, setGeneratedLatex] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { saveTemplate } = useTemplates();

    useEffect(() => {
        if (messages.length === 0) {
            const initialMessage: Message = {
                id: "initial-bot",
                role: "bot",
                content: "Hello! I'm your AI Resume Assistant. I'll help you build a professional resume. Let's start with your personal information – what's your full name, email, and phone number?",
                timestamp: new Date()
            };
            setMessages([initialMessage]);
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isBotTyping]);

    const handleSend = async () => {
        if (!inputValue.trim() || isBotTyping || isGeneratingInMode) return;

        const userText = inputValue.trim();
        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: userText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsBotTyping(true);

        try {
            // Call the dynamic chat endpoint
            const response = await supabase.functions.invoke('resume-chat', {
                body: {
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                    resumeData,
                    currentStep: STEPS[currentStepIndex].id
                }
            });

            if (response.data) {
                const { reply, updatedData, shouldAdvaceStep } = response.data;

                // Sync the local resume data with AI's extraction
                if (updatedData) {
                    setResumeData(prev => ({ ...prev, ...updatedData }));
                }

                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "bot",
                    content: reply,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMsg]);

                if (shouldAdvaceStep) {
                    if (currentStepIndex < STEPS.length - 1) {
                        setCurrentStepIndex(prev => prev + 1);
                    } else if (currentStepIndex === STEPS.length - 1) {
                        // All steps done, trigger final generation
                        await generateResumeFinal({ ...resumeData, ...updatedData });
                    }
                }
            } else {
                throw new Error("No response from AI");
            }
        } catch (error) {
            console.error("Chat error:", error);
            const botErrorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "bot",
                content: "I'm sorry, I hit a snag. Could you please repeat that or try again?",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botErrorMsg]);
        } finally {
            setIsBotTyping(false);
        }
    };

    const generateResumeFinal = async (finalData: ResumeData) => {
        setIsGeneratingInMode(true);
        setIsBotTyping(true);

        try {
            const dataStr = JSON.stringify(finalData);
            const response = await supabase.functions.invoke('optimize-resume', {
                body: {
                    job_description: `RESUME DATA: ${dataStr}\n\nINSTRUCTION: Create a complete, professional, one-page LaTeX resume. Use a clean, modern, ATS-friendly format.`
                }
            });

            if (response.data?.success && response.data?.latex_code) {
                setGeneratedLatex(response.data.latex_code);
                await saveTemplate(`AI Builder - ${new Date().toLocaleDateString()}`, response.data.latex_code, true);

                const botMsg: Message = {
                    id: Date.now().toString(),
                    role: "bot",
                    content: "Great news! Your professional resume has been successfully generated and set as your default template. You can now download it or adjust it in Advanced Mode!",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMsg]);

                toast({
                    title: "Resume Built!",
                    description: "Your new resume is ready.",
                });
            } else {
                throw new Error("Generation failed");
            }
        } catch (error) {
            const botErrorMsg: Message = {
                id: Date.now().toString(),
                role: "bot",
                content: "I encountered a problem generating the final PDF. Don't worry, your data is saved. You can try generating again or use Advanced Mode.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botErrorMsg]);
        } finally {
            setIsGeneratingInMode(false);
            setIsBotTyping(false);
        }
    };

    const resetChat = () => {
        setMessages([]);
        setResumeData({
            personalInfo: { name: "", email: "", phone: "", linkedin: "", portfolio: "" },
            experience: "",
            education: "",
            skills: "",
            projects: "",
            certifications: ""
        });
        setCurrentStepIndex(0);
        setGeneratedLatex(null);
        const initialMessage: Message = {
            id: "reset-bot",
            role: "bot",
            content: "Let's start fresh! What's your full name and contact information?",
            timestamp: new Date()
        };
        setMessages([initialMessage]);
    };

    return (
        <div className="flex flex-col h-[700px] max-w-4xl mx-auto bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Resume Architect AI</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold tracking-tighter">Dynamic Intelligence Active</span>
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetChat} className="text-muted-foreground hover:text-foreground h-8 gap-1.5 transition-all active:scale-95">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restart
                </Button>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                        {messages.map((m) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border shadow-sm ${m.role === "user" ? "bg-primary border-primary" : "bg-card border-border"
                                        }`}>
                                        {m.role === "user" ? <User className="w-4 h-4 text-primary-foreground" /> : <Bot className="w-4 h-4 text-primary" />}
                                    </div>
                                    <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed ${m.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-muted/80 text-foreground rounded-tl-none border border-border/50 backdrop-blur-sm"
                                        }`}>
                                        {m.content}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isBotTyping && !generatedLatex && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="flex gap-2 items-center bg-muted/40 px-4 py-2 rounded-full border border-border/40">
                                <span className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce"></span>
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Analyzing Input...</span>
                            </div>
                        </motion.div>
                    )}

                    {generatedLatex && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-8 bg-gradient-to-br from-primary/10 to-accent/5 rounded-3xl border border-primary/20 text-center shadow-xl mb-4"
                        >
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <CheckCircle2 className="h-10 w-10 text-primary" />
                            </div>
                            <h4 className="text-xl font-bold mb-3 tracking-tight">Your Architected Resume is Ready!</h4>
                            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
                                We've processed your professional journey and crafted a high-impact template.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button variant="default" className="gap-2 h-11 px-8 rounded-xl shadow-lg shadow-primary/25 active:scale-95 transition-all" onClick={() => window.location.href = "/"}>
                                    <FileText className="h-4 w-4" />
                                    Launch Preview
                                </Button>
                                <Button variant="outline" className="gap-2 h-11 px-8 rounded-xl border-primary/20 hover:bg-primary/5 active:scale-95 transition-all" onClick={resetChat}>
                                    New Architect
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-muted/20 border-t backdrop-blur-md">
                {!generatedLatex && (
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="relative flex items-end gap-2"
                    >
                        <Textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={isBotTyping ? "AI is processing..." : "Describe your professional details..."}
                            className="min-h-[60px] max-h-[150px] pr-14 pl-4 py-3 bg-background border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 shadow-inner resize-none transition-all rounded-2xl text-sm"
                            disabled={isBotTyping}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!inputValue.trim() || isBotTyping}
                            className="absolute right-2.5 bottom-2.5 h-10 w-10 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-90 transition-all z-10"
                        >
                            {isBotTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </form>
                )}
                <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground/60 px-2 font-medium">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                        <span className="uppercase tracking-widest">Intelligent Resume Logic Engine</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: "0%" }}
                                animate={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
                            />
                        </div>
                        <span className="min-w-[40px] text-right">{currentStepIndex + 1} / {STEPS.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
