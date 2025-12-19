import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Mail, 
  HelpCircle, 
  Sparkles, 
  FileText, 
  Zap,
  Target,
  Users,
  MessageCircle
} from "lucide-react";

export default function Help() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
            <HelpCircle className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
          <p className="text-muted-foreground text-sm">We're here to help you succeed</p>
        </div>

        {/* Mission Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <Sparkles className="w-10 h-10 mx-auto text-primary mb-4" />
            <h2 className="text-xl font-bold mb-3">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              We believe everyone deserves a fair chance at landing their dream job. 
              This app is built for the job seekers who are struggling, the underdogs, 
              and the dreamers who just need that one opportunity to prove themselves.
            </p>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Your next career breakthrough is just one resume away. Let's make it happen together.
            </p>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold">Paste the Job Description</h4>
                <p className="text-sm text-muted-foreground">
                  Copy the job posting you want to apply for
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold">AI Optimization</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes keywords and tailors your resume for ATS systems
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold">Download & Apply</h4>
                <p className="text-sm text-muted-foreground">
                  Get your optimized PDF resume and land more interviews
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/30">
                <FileText className="h-6 w-6 text-primary mb-2" />
                <h4 className="font-semibold text-sm">ATS Optimized</h4>
                <p className="text-xs text-muted-foreground">Beat applicant tracking systems</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <Zap className="h-6 w-6 text-primary mb-2" />
                <h4 className="font-semibold text-sm">AI Powered</h4>
                <p className="text-xs text-muted-foreground">Smart keyword matching</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <Sparkles className="h-6 w-6 text-primary mb-2" />
                <h4 className="font-semibold text-sm">LaTeX Quality</h4>
                <p className="text-xs text-muted-foreground">Professional typesetting</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <Users className="h-6 w-6 text-primary mb-2" />
                <h4 className="font-semibold text-sm">Save & Access</h4>
                <p className="text-xs text-muted-foreground">Cloud-synced resumes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dedication */}
        <Card className="bg-gradient-to-br from-destructive/5 to-primary/5 border-destructive/20">
          <CardContent className="p-6 text-center">
            <Heart className="w-12 h-12 mx-auto text-destructive fill-destructive mb-4" />
            <h3 className="text-lg font-bold mb-2">
              Dedicated with Love
            </h3>
            <p className="text-muted-foreground text-sm">
              This project is dedicated to my love ❤️
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              And to everyone out there grinding for their next opportunity — 
              this is your best entry chance.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Contact & Support
            </CardTitle>
            <CardDescription>
              Got questions or feedback? Reach out!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30">
              <p className="font-semibold">Koushik Navuluri</p>
              <p className="text-sm text-muted-foreground">Creator & Developer</p>
            </div>
            <Button 
              className="w-full"
              variant="outline"
              onClick={() => window.location.href = 'mailto:koushiknavuluri@gmail.com'}
            >
              <Mail className="h-4 w-4 mr-2" />
              koushiknavuluri@gmail.com
            </Button>
          </CardContent>
        </Card>

        {/* Version */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          <p>ResumeStudio v1.0</p>
          <p className="mt-1">Made with ❤️ for job seekers everywhere</p>
        </div>
      </div>
    </AppLayout>
  );
}
