import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile, WorkExperience, Education, Certification } from "@/hooks/useUserProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { PageTransition, staggerContainer, fadeInUp } from "@/components/animations/PageTransition";
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Award,
  Plus,
  Trash2,
  Save,
  Loader2,
  Mail,
  Phone,
  Linkedin,
  Github,
  Globe,
  MapPin,
  X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading, saving, saveProfile } = useUserProfile();
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [address, setAddress] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [workHistory, setWorkHistory] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setLinkedinUrl(profile.linkedin_url || "");
      setGithubUrl(profile.github_url || "");
      setPortfolioUrl(profile.portfolio_url || "");
      setAddress(profile.address || "");
      setSummary(profile.summary || "");
      setSkills(profile.skills || []);
      setWorkHistory(profile.work_history || []);
      setEducation(profile.education || []);
      setCertifications(profile.certifications || []);
    }
  }, [profile]);

  const handleSave = async () => {
    await saveProfile({
      full_name: fullName || null,
      email: email || null,
      phone: phone || null,
      linkedin_url: linkedinUrl || null,
      github_url: githubUrl || null,
      portfolio_url: portfolioUrl || null,
      address: address || null,
      summary: summary || null,
      skills,
      work_history: workHistory,
      education,
      certifications,
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const addWorkExperience = () => {
    setWorkHistory([...workHistory, {
      id: crypto.randomUUID(),
      company: "",
      title: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    }]);
  };

  const updateWorkExperience = (id: string, updates: Partial<WorkExperience>) => {
    setWorkHistory(workHistory.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const removeWorkExperience = (id: string) => {
    setWorkHistory(workHistory.filter(w => w.id !== id));
  };

  const addEducation = () => {
    setEducation([...education, {
      id: crypto.randomUUID(),
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      gpa: "",
    }]);
  };

  const updateEducation = (id: string, updates: Partial<Education>) => {
    setEducation(education.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter(e => e.id !== id));
  };

  const addCertification = () => {
    setCertifications([...certifications, {
      id: crypto.randomUUID(),
      name: "",
      issuer: "",
      date: "",
      expiryDate: "",
      url: "",
    }]);
  };

  const updateCertification = (id: string, updates: Partial<Certification>) => {
    setCertifications(certifications.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCertification = (id: string) => {
    setCertifications(certifications.filter(c => c.id !== id));
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-muted-foreground">Please sign in to manage your profile.</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageTransition>
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Professional Profile</h1>
              <p className="text-muted-foreground text-sm">
                Save your info to auto-fill resumes
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Profile
            </Button>
          </motion.div>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal" className="text-xs sm:text-sm">
                <User className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Personal</span>
              </TabsTrigger>
              <TabsTrigger value="experience" className="text-xs sm:text-sm">
                <Briefcase className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Experience</span>
              </TabsTrigger>
              <TabsTrigger value="education" className="text-xs sm:text-sm">
                <GraduationCap className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Education</span>
              </TabsTrigger>
              <TabsTrigger value="certifications" className="text-xs sm:text-sm">
                <Award className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Certs</span>
              </TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal">
              <motion.div variants={fadeInUp}>
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                    <CardDescription>Your contact details and professional summary</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="flex items-center gap-2">
                          <User className="h-4 w-4" /> Full Name
                        </Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" /> Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" /> Phone
                        </Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Location
                        </Label>
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="New York, NY"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin" className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4" /> LinkedIn
                        </Label>
                        <Input
                          id="linkedin"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          placeholder="linkedin.com/in/johndoe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="github" className="flex items-center gap-2">
                          <Github className="h-4 w-4" /> GitHub
                        </Label>
                        <Input
                          id="github"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          placeholder="github.com/johndoe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portfolio" className="flex items-center gap-2">
                          <Globe className="h-4 w-4" /> Portfolio
                        </Label>
                        <Input
                          id="portfolio"
                          value={portfolioUrl}
                          onChange={(e) => setPortfolioUrl(e.target.value)}
                          placeholder="johndoe.com"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="summary">Professional Summary</Label>
                      <Textarea
                        id="summary"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Brief overview of your professional background and career goals..."
                        rows={4}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Skills</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill..."
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        />
                        <Button type="button" onClick={addSkill} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="gap-1">
                            {skill}
                            <button onClick={() => removeSkill(skill)}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Work Experience Tab */}
            <TabsContent value="experience">
              <motion.div variants={fadeInUp} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Work Experience</h3>
                  <Button onClick={addWorkExperience} size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Add Experience
                  </Button>
                </div>

                {workHistory.map((work, index) => (
                  <Card key={work.id} className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm text-muted-foreground">
                          Experience {index + 1}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWorkExperience(work.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Job Title</Label>
                          <Input
                            value={work.title}
                            onChange={(e) => updateWorkExperience(work.id, { title: e.target.value })}
                            placeholder="Software Engineer"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Company</Label>
                          <Input
                            value={work.company}
                            onChange={(e) => updateWorkExperience(work.id, { company: e.target.value })}
                            placeholder="Tech Corp"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            value={work.location}
                            onChange={(e) => updateWorkExperience(work.id, { location: e.target.value })}
                            placeholder="San Francisco, CA"
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="space-y-2 flex-1">
                            <Label>Start Date</Label>
                            <Input
                              type="month"
                              value={work.startDate}
                              onChange={(e) => updateWorkExperience(work.id, { startDate: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2 flex-1">
                            <Label>End Date</Label>
                            <Input
                              type="month"
                              value={work.endDate}
                              onChange={(e) => updateWorkExperience(work.id, { endDate: e.target.value })}
                              disabled={work.current}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={work.current}
                          onCheckedChange={(checked) => updateWorkExperience(work.id, { current: checked, endDate: checked ? "" : work.endDate })}
                        />
                        <Label>Currently working here</Label>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={work.description}
                          onChange={(e) => updateWorkExperience(work.id, { description: e.target.value })}
                          placeholder="Describe your responsibilities and achievements..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {workHistory.length === 0 && (
                  <Card className="bg-card/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No work experience added yet</p>
                      <Button onClick={addWorkExperience} variant="outline" className="mt-4">
                        <Plus className="h-4 w-4 mr-2" /> Add Your First Experience
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education">
              <motion.div variants={fadeInUp} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Education</h3>
                  <Button onClick={addEducation} size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Add Education
                  </Button>
                </div>

                {education.map((edu, index) => (
                  <Card key={edu.id} className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm text-muted-foreground">
                          Education {index + 1}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEducation(edu.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Institution</Label>
                          <Input
                            value={edu.institution}
                            onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                            placeholder="University of Example"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Degree</Label>
                          <Input
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                            placeholder="Bachelor of Science"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Field of Study</Label>
                          <Input
                            value={edu.field}
                            onChange={(e) => updateEducation(edu.id, { field: e.target.value })}
                            placeholder="Computer Science"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>GPA (Optional)</Label>
                          <Input
                            value={edu.gpa || ""}
                            onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })}
                            placeholder="3.8/4.0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input
                            type="month"
                            value={edu.startDate}
                            onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input
                            type="month"
                            value={edu.endDate}
                            onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {education.length === 0 && (
                  <Card className="bg-card/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No education added yet</p>
                      <Button onClick={addEducation} variant="outline" className="mt-4">
                        <Plus className="h-4 w-4 mr-2" /> Add Your Education
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            {/* Certifications Tab */}
            <TabsContent value="certifications">
              <motion.div variants={fadeInUp} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Certifications</h3>
                  <Button onClick={addCertification} size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Add Certification
                  </Button>
                </div>

                {certifications.map((cert, index) => (
                  <Card key={cert.id} className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm text-muted-foreground">
                          Certification {index + 1}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertification(cert.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Certification Name</Label>
                          <Input
                            value={cert.name}
                            onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
                            placeholder="AWS Solutions Architect"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Issuing Organization</Label>
                          <Input
                            value={cert.issuer}
                            onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                            placeholder="Amazon Web Services"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Issue Date</Label>
                          <Input
                            type="month"
                            value={cert.date}
                            onChange={(e) => updateCertification(cert.id, { date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Expiry Date (Optional)</Label>
                          <Input
                            type="month"
                            value={cert.expiryDate || ""}
                            onChange={(e) => updateCertification(cert.id, { expiryDate: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label>Credential URL (Optional)</Label>
                          <Input
                            value={cert.url || ""}
                            onChange={(e) => updateCertification(cert.id, { url: e.target.value })}
                            placeholder="https://credentials.example.com/verify/..."
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {certifications.length === 0 && (
                  <Card className="bg-card/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Award className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No certifications added yet</p>
                      <Button onClick={addCertification} variant="outline" className="mt-4">
                        <Plus className="h-4 w-4 mr-2" /> Add Your Certifications
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </PageTransition>
    </AppLayout>
  );
}
