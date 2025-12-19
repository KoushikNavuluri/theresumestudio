import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, ExternalLink } from "lucide-react";
import { Resume } from "@/hooks/useResumes";

interface SavedResumesProps {
  resumes: Resume[];
  onLoadResume: (resume: Resume) => void;
}

export const SavedResumes = ({ resumes, onLoadResume }: SavedResumesProps) => {
  return (
    <Card className="mt-8 bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Saved Resumes
        </CardTitle>
        <CardDescription>
          Your previously generated resumes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <Card 
              key={resume.id} 
              className="bg-background/50 hover:bg-background/80 transition-colors cursor-pointer group"
              onClick={() => onLoadResume(resume)}
            >
              <CardContent className="p-4">
                <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                  {resume.title}
                </h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <Calendar className="h-3 w-3" />
                  {new Date(resume.updated_at).toLocaleDateString()}
                </div>
                {resume.pdf_url && (
                  <a 
                    href={resume.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View PDF
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
