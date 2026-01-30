import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useApiTokens, ApiToken } from "@/hooks/useApiTokens";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { PageTransition, staggerContainer, fadeInUp } from "@/components/animations/PageTransition";
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Code2,
  Zap,
  BarChart3,
  Shield,
  ExternalLink
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ApiPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tokens, loading, usageStats, generateToken, revokeToken, toggleToken } = useApiTokens();
  
  const [newKeyName, setNewKeyName] = useState("My API Key");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleCreateKey = async () => {
    setIsCreating(true);
    const result = await generateToken(newKeyName || "My API Key");
    setIsCreating(false);
    
    if (result?.full_token) {
      setCreatedKey(result.full_token);
      setNewKeyName("My API Key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setCreatedKey(null);
    setShowKey(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
                <Key className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">API Access</h1>
                <p className="text-sm text-muted-foreground">
                  Integrate ResumeStudio into your applications
                </p>
              </div>
            </motion.div>
            
            <Card className="p-12 text-center">
              <Key className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Sign In Required</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please sign in to manage your API keys
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
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-4xl mx-auto px-4 py-6 space-y-6"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-[image:var(--gradient-primary)] flex items-center justify-center"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Key className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">API Access</h1>
                <p className="text-sm text-muted-foreground">
                  Integrate ResumeStudio into your applications
                </p>
              </div>
            </div>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {createdKey ? "🎉 API Key Created!" : "Create New API Key"}
                  </DialogTitle>
                  <DialogDescription>
                    {createdKey 
                      ? "Copy your key now — it won't be shown again!"
                      : "Give your API key a name to identify it later"
                    }
                  </DialogDescription>
                </DialogHeader>
                
                {!createdKey ? (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyName">Key Name</Label>
                        <Input
                          id="keyName"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          placeholder="e.g., Production App"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateKey} disabled={isCreating} className="w-full gap-2">
                        {isCreating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Key className="h-4 w-4" />
                            Generate Key
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <code className="text-sm font-mono break-all">
                            {showKey ? createdKey : createdKey.replace(/./g, '•').substring(0, 20) + '...'}
                          </code>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setShowKey(!showKey)}
                            >
                              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(createdKey)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                        <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Store this key securely. You won't be able to see it again.</span>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCloseCreateDialog} className="w-full">
                        Done
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Quick Stats */}
          {usageStats && (
            <motion.div variants={fadeInUp}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs">Total Requests</span>
                  </div>
                  <p className="text-2xl font-bold">{usageStats.total_requests}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs">Today</span>
                  </div>
                  <p className="text-2xl font-bold">{usageStats.requests_today}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Avg Latency</span>
                  </div>
                  <p className="text-2xl font-bold">{usageStats.avg_latency_ms}ms</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs">Success Rate</span>
                  </div>
                  <p className="text-2xl font-bold">{usageStats.success_rate}%</p>
                </Card>
              </div>
            </motion.div>
          )}

          {/* API Keys List */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Your API Keys
                </CardTitle>
                <CardDescription>
                  Manage your API keys for programmatic access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : tokens.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      No API keys yet. Create one to get started.
                    </p>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Your First Key
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {tokens.map((token, index) => (
                        <motion.div
                          key={token.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium truncate">{token.name}</h4>
                                {token.is_active ? (
                                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                                    Disabled
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <code className="bg-muted px-2 py-0.5 rounded">{token.token_prefix}...</code>
                                <span>Created {formatDate(token.created_at)}</span>
                                <span>Last used {formatDate(token.last_used_at)}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                {token.permissions.map((perm) => (
                                  <Badge key={perm} variant="outline" className="text-xs">
                                    {perm}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Switch
                                checked={token.is_active}
                                onCheckedChange={(checked) => toggleToken(token.id, checked)}
                              />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the API key "{token.name}". 
                                      Any applications using this key will stop working immediately.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => revokeToken(token.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Revoke Key
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Start Guide */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  Quick Start
                </CardTitle>
                <CardDescription>
                  Start using the ResumeStudio API in minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Optimize a Resume</h4>
                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/public-api/optimize \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: rs_your_api_key_here" \\
  -d '{
    "job_description": "We are looking for a Senior Software Engineer..."
  }'`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Analyze ATS Compatibility</h4>
                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/public-api/analyze \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: rs_your_api_key_here" \\
  -d '{
    "latex_code": "\\\\documentclass{article}...",
    "job_description": "We are looking for..."
  }'`}
                  </pre>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Full API Documentation</h4>
                    <p className="text-xs text-muted-foreground">
                      View all endpoints, parameters, and examples
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => navigate("/api/docs")} className="gap-2">
                    View Docs
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Rate Limits Info */}
          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/10">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Rate Limits</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      API requests are rate limited to ensure fair usage for all users.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Per minute:</span>
                        <span className="font-medium ml-2">10 requests</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Per day:</span>
                        <span className="font-medium ml-2">100 requests</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </PageTransition>
    </AppLayout>
  );
}
