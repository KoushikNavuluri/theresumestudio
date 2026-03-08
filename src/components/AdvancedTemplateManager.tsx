import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTemplates, Template } from "@/hooks/useTemplates";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    FileCode,
    Plus,
    Trash2,
    Edit3,
    Check,
    X,
    Star,
    Loader2
} from "lucide-react";

export const AdvancedTemplateManager = () => {
    const { templates, loading, saveTemplate, updateTemplate, deleteTemplate } = useTemplates();

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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Template List */}
            <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Your Templates ({templates.length})
                    </h3>
                    {!isEditing && (
                        <Button onClick={handleCreateNew} size="sm" variant="outline" className="h-8 gap-1">
                            <Plus className="h-3.5 w-3.5" />
                            New
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : templates.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                        <FileCode className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No templates yet. Create your first one to get started.
                        </p>
                        <Button onClick={handleCreateNew} variant="link" className="mt-2 text-primary">
                            Create New Template
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
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
                                        className={`group cursor-pointer transition-all hover:shadow-md ${editingTemplate?.id === template.id
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'hover:border-primary/40'
                                            }`}
                                        onClick={() => handleEdit(template)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-sm truncate">{template.name}</h4>
                                                        {template.is_default && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 rounded-full">
                                                                <Star className="h-3 w-3 text-primary fill-primary" />
                                                                <span className="text-[10px] font-bold text-primary uppercase">Default</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Updated {new Date(template.updated_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
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
                    </div>
                )}
            </div>

            {/* Editor Panel */}
            <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.div
                            key="editor"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="border-primary/20 overflow-hidden">
                                <CardHeader className="bg-muted/30 border-b">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Edit3 className="h-5 w-5 text-primary" />
                                            {isCreating ? "Create Template" : "Edit Template"}
                                        </CardTitle>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleCancel}
                                                className="h-8"
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Template Name
                                        </Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Modern Professional, Academic CV..."
                                            className="bg-muted/20"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="latex" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                LaTeX Code
                                            </Label>
                                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                Standard LaTeX format
                                            </span>
                                        </div>
                                        <Textarea
                                            id="latex"
                                            value={latexCode}
                                            onChange={(e) => setLatexCode(e.target.value)}
                                            placeholder="\\documentclass{article}..."
                                            className="min-h-[400px] font-mono text-xs bg-muted/20 resize-y focus-visible:ring-primary/30"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="default" className="text-sm font-medium">
                                                Default Template
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Use this template as the base for new AI generations
                                            </p>
                                        </div>
                                        <Switch
                                            id="default"
                                            checked={isDefault}
                                            onCheckedChange={setIsDefault}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSave}
                                        className="w-full gap-2 h-11 text-base font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Saving Template...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-5 w-5" />
                                                Save Template
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex items-center justify-center p-12 bg-muted/10 rounded-xl border-2 border-dashed border-border/60"
                        >
                            <div className="text-center max-w-sm">
                                <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-6">
                                    <FileCode className="h-10 w-10 text-primary/40" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">No Template Selected</h3>
                                <p className="text-sm text-muted-foreground mb-8">
                                    Choose a template from the list to modify it, or build a new one from scratch.
                                </p>
                                <Button onClick={handleCreateNew} size="lg" className="gap-2 shadow-md">
                                    <Plus className="h-5 w-5" />
                                    Create Your First Template
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
