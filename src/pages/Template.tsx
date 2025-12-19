import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useTemplates, Template } from "@/hooks/useTemplates";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageTransition, fadeInUp } from "@/components/animations/PageTransition";
import { 
  FileCode, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  Star,
  Loader2
} from "lucide-react";

const TemplatePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { templates, loading, saveTemplate, updateTemplate, deleteTemplate, getDefaultTemplate } = useTemplates();
  
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [latexCode, setLatexCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setName("My Template");
    setLatexCode("");
    setIsDefault(templates.length === 0);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setIsCreating(false);
    setName(template.name);
    setLatexCode(template.latex_code);
    setIsDefault(template.is_default);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingTemplate(null);
    setName("");
    setLatexCode("");
    setIsDefault(false);
  };

  const handleSave = async () => {
    if (!latexCode.trim()) {
      toast({
        title: "Template required",
        description: "Please enter your LaTeX template code.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (isCreating) {
        const result = await saveTemplate(name || "My Template", latexCode, isDefault);
        if (result) {
          toast({ title: "Template saved!", description: `Created "${name}"` });
          handleCancel();
        } else {
          throw new Error("Failed to save");
        }
      } else if (editingTemplate) {
        const success = await updateTemplate(editingTemplate.id, { 
          name: name || "My Template", 
          latex_code: latexCode, 
          is_default: isDefault 
        });
        if (success) {
          toast({ title: "Template updated!", description: `Updated "${name}"` });
          handleCancel();
        } else {
          throw new Error("Failed to update");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (template: Template) => {
    const success = await deleteTemplate(template.id);
    if (success) {
      toast({ title: "Template deleted", description: `Removed "${template.name}"` });
      if (editingTemplate?.id === template.id) {
        handleCancel();
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
    }
  };

  const isEditing = isCreating || editingTemplate !== null;

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <AppLayout>
        <PageTransition>
          <div className="max-w-4xl mx-auto px-4 py-6">
            <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-[image:var(--gradient-primary)] flex items-center justify-center"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <FileCode className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Templates</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your LaTeX resume templates
                </p>
              </div>
            </motion.div>
            
            <Card className="p-12 text-center">
              <FileCode className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Sign In Required</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please sign in to manage your LaTeX templates
              </p>
              <Button onClick={() => navigate("/auth")} className="gap-2">
                Sign In
              </Button>
            </Card>
          </div>
        </PageTransition>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-[image:var(--gradient-primary)] flex items-center justify-center"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <FileCode className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Templates</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your LaTeX resume templates
                </p>
              </div>
            </div>
            
            {!isEditing && (
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Template List */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Your Templates ({templates.length})
              </h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : templates.length === 0 ? (
                <Card className="p-6 text-center">
                  <FileCode className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No templates yet. Create your first one!
                  </p>
                </Card>
              ) : (
                <AnimatePresence>
                  {templates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all hover:border-primary/50 ${
                          editingTemplate?.id === template.id ? 'border-primary ring-1 ring-primary' : ''
                        }`}
                        onClick={() => handleEdit(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm truncate">{template.name}</h4>
                                {template.is_default && (
                                  <Star className="h-3.5 w-3.5 text-primary fill-primary flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(template.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(template);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Editor Panel */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editor"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Edit3 className="h-5 w-5" />
                          {isCreating ? "Create Template" : "Edit Template"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Template Name</Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Resume Template"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="latex">LaTeX Code</Label>
                          <Textarea
                            id="latex"
                            value={latexCode}
                            onChange={(e) => setLatexCode(e.target.value)}
                            placeholder="Paste your LaTeX template code here..."
                            className="min-h-[300px] font-mono text-xs"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <Switch
                            id="default"
                            checked={isDefault}
                            onCheckedChange={setIsDefault}
                          />
                          <Label htmlFor="default" className="text-sm">
                            Set as default template for AI generation
                          </Label>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button 
                            onClick={handleSave} 
                            className="flex-1 gap-2"
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                Save Template
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleCancel}
                            disabled={isSaving}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card className="p-12 text-center">
                      <FileCode className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Template Selected</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Select a template to edit or create a new one
                      </p>
                      <Button onClick={handleCreateNew} variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create New Template
                      </Button>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default TemplatePage;
