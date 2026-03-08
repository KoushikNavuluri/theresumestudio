import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useResumes, Resume } from "@/hooks/useResumes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResumeCardSkeleton } from "@/components/ui/skeleton-shimmer";
import { PageTransition, staggerContainer, fadeInUp } from "@/components/animations/PageTransition";
import {
  FileText,
  Calendar,
  Download,
  Trash2,
  FolderOpen,
  Plus,
  ExternalLink
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Saved() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { resumes, loading: resumesLoading, deleteResume } = useResumes();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const success = await deleteResume(id);
    if (success) {
      toast({
        title: "Resume deleted",
        description: "Your resume has been removed.",
      });
    } else {
      toast({
        title: "Delete failed",
        description: "Failed to delete resume. Please try again.",
        variant: "destructive",
      });
    }
    setDeletingId(null);
  };

  const handleLoadResume = (resume: Resume) => {
    // Store resume data in session storage for the home page to pick up
    sessionStorage.setItem("loadResume", JSON.stringify(resume));
    navigate("/");
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
            <FolderOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Sign in to view saved resumes</h1>
          <p className="text-muted-foreground mb-6">
            Create an account to save and access your resumes anywhere
          </p>
          <Button onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageTransition>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between pt-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-foreground">Saved Resumes</h1>
              <p className="text-muted-foreground text-sm">
                {resumes.length} resume{resumes.length !== 1 ? "s" : ""} saved
              </p>
            </div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button onClick={() => navigate("/")} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </motion.div>
          </motion.div>

          {/* Resume List */}
          {resumesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <ResumeCardSkeleton key={i} />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-card/50 border-dashed">
                <CardContent className="py-12 text-center">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  </motion.div>
                  <h3 className="font-semibold mb-2">No resumes yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate your first AI-optimized resume
                  </p>
                  <Button onClick={() => navigate("/")}>
                    Create Resume
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              {resumes.map((resume, index) => (
                <motion.div
                  key={resume.id}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.01, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-card/80 backdrop-blur-sm border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleLoadResume(resume)}
                        >
                          <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                            {resume.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(resume.updated_at).toLocaleDateString()}
                          </div>
                          {resume.job_description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {resume.job_description.substring(0, 100)}...
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {resume.pdf_url && (
                            <motion.a
                              href={resume.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ExternalLink className="h-4 w-4 text-primary" />
                            </motion.a>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive"
                                  disabled={deletingId === resume.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete resume?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your resume.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(resume.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </PageTransition>
    </AppLayout>
  );
}
