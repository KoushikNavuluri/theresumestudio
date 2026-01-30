import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageTransition, staggerContainer, fadeInUp } from "@/components/animations/PageTransition";
import { 
  Book, 
  Code2, 
  Key, 
  Zap, 
  FileText,
  BarChart3,
  Download,
  CreditCard,
  List,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from "lucide-react";

const CodeBlock = ({ children, language = "bash" }: { children: string; language?: string }) => (
  <pre className="p-4 bg-zinc-950 text-zinc-100 rounded-lg text-xs overflow-x-auto">
    <code>{children}</code>
  </pre>
);

const EndpointCard = ({ 
  method, 
  path, 
  description, 
  permission,
  requestBody,
  responseBody,
  children 
}: { 
  method: "GET" | "POST";
  path: string;
  description: string;
  permission?: string;
  requestBody?: string;
  responseBody?: string;
  children?: React.ReactNode;
}) => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <Badge 
          variant={method === "GET" ? "secondary" : "default"}
          className={method === "POST" ? "bg-green-600 hover:bg-green-600" : ""}
        >
          {method}
        </Badge>
        <code className="text-sm font-mono">{path}</code>
        {permission && (
          <Badge variant="outline" className="ml-auto text-xs">
            {permission}
          </Badge>
        )}
      </div>
      <CardDescription className="mt-2">{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {requestBody && (
        <div>
          <h4 className="text-sm font-medium mb-2">Request Body</h4>
          <CodeBlock language="json">{requestBody}</CodeBlock>
        </div>
      )}
      {responseBody && (
        <div>
          <h4 className="text-sm font-medium mb-2">Response</h4>
          <CodeBlock language="json">{responseBody}</CodeBlock>
        </div>
      )}
      {children}
    </CardContent>
  </Card>
);

export default function ApiDocs() {
  const baseUrl = "https://YOUR_PROJECT.supabase.co/functions/v1/public-api";

  return (
    <AppLayout>
      <PageTransition>
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-4xl mx-auto px-4 py-6 space-y-8"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="text-center">
            <div className="flex justify-center mb-4">
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-[image:var(--gradient-primary)] flex items-center justify-center"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Book className="w-8 h-8 text-primary-foreground" />
              </motion.div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">API Documentation</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Integrate ResumeStudio's AI-powered resume optimization into your applications
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={fadeInUp}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Key, label: "Authentication", href: "#authentication" },
                { icon: Zap, label: "Optimize", href: "#optimize" },
                { icon: BarChart3, label: "Analyze", href: "#analyze" },
                { icon: Download, label: "Convert", href: "#convert" },
              ].map((item) => (
                <a 
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <item.icon className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">{item.label}</span>
                </a>
              ))}
            </div>
          </motion.div>

          {/* Base URL */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Base URL</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock>{baseUrl}</CodeBlock>
                <p className="text-sm text-muted-foreground mt-3">
                  Replace <code className="bg-muted px-1.5 py-0.5 rounded">YOUR_PROJECT</code> with your Supabase project reference.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Authentication */}
          <motion.div variants={fadeInUp} id="authentication">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Authentication
                </CardTitle>
                <CardDescription>
                  All API requests require authentication via API key
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  Include your API key in the request headers using one of these methods:
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Option 1: x-api-key header (recommended)</h4>
                    <CodeBlock>{`curl -H "x-api-key: rs_your_api_key_here" ${baseUrl}/optimize`}</CodeBlock>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Option 2: Authorization header</h4>
                    <CodeBlock>{`curl -H "Authorization: Bearer rs_your_api_key_here" ${baseUrl}/optimize`}</CodeBlock>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Error Responses</h4>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="destructive" className="text-xs">401</Badge>
                      <span>Missing or invalid API key</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="destructive" className="text-xs">403</Badge>
                      <span>Insufficient permissions for endpoint</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="destructive" className="text-xs">429</Badge>
                      <span>Rate limit exceeded</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Endpoints */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-xl font-bold mb-4">Endpoints</h2>
            
            <Tabs defaultValue="optimize" className="space-y-4">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="optimize">Optimize</TabsTrigger>
                <TabsTrigger value="analyze">Analyze</TabsTrigger>
                <TabsTrigger value="convert">Convert</TabsTrigger>
                <TabsTrigger value="credits">Credits</TabsTrigger>
                <TabsTrigger value="resumes">Resumes</TabsTrigger>
              </TabsList>

              <TabsContent value="optimize" id="optimize">
                <EndpointCard
                  method="POST"
                  path="/optimize"
                  description="Generate an ATS-optimized resume tailored to a specific job description"
                  permission="optimize"
                  requestBody={`{
  "job_description": "We are looking for a Senior Software Engineer with experience in React, Node.js, and cloud technologies...",
  "template": "\\\\documentclass{article}..." // optional, uses your default template if not provided
}`}
                  responseBody={`{
  "success": true,
  "latex_code": "\\\\documentclass[10pt,a4paper]{article}...",
  "credits_remaining": 9
}`}
                >
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Notes</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Each optimization consumes 1 credit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Job description max length: 50,000 characters</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>If no template provided, uses your default template or base template</span>
                      </li>
                    </ul>
                  </div>
                </EndpointCard>
              </TabsContent>

              <TabsContent value="analyze" id="analyze">
                <EndpointCard
                  method="POST"
                  path="/analyze"
                  description="Analyze a resume's ATS compatibility against a job description"
                  permission="analyze"
                  requestBody={`{
  "latex_code": "\\\\documentclass{article}...",
  "job_description": "We are looking for a Senior Software Engineer..."
}`}
                  responseBody={`{
  "success": true,
  "atsScore": 85,
  "keywordMatch": 78,
  "matchedKeywords": ["React", "Node.js", "TypeScript", "AWS"],
  "missingKeywords": ["Kubernetes", "GraphQL"],
  "suggestions": [
    "Add cloud deployment experience",
    "Mention specific frameworks used"
  ]
}`}
                >
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Score Interpretation</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>80-100: Excellent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span>60-79: Good</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>0-59: Needs work</span>
                      </div>
                    </div>
                  </div>
                </EndpointCard>
              </TabsContent>

              <TabsContent value="convert" id="convert">
                <EndpointCard
                  method="POST"
                  path="/convert"
                  description="Convert LaTeX code to a downloadable PDF"
                  permission="convert"
                  requestBody={`{
  "latex_code": "\\\\documentclass{article}..."
}`}
                  responseBody={`{
  "success": true,
  "pdf_base64": "JVBERi0xLjQKJeLjz9MKNSAwIG9...",
  "content_type": "application/pdf"
}`}
                >
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Usage Example</h4>
                    <CodeBlock language="javascript">{`// Decode and save PDF
const response = await fetch('/convert', { ... });
const data = await response.json();

const pdfBlob = atob(data.pdf_base64);
const blob = new Blob([pdfBlob], { type: 'application/pdf' });
const url = URL.createObjectURL(blob);

// Download
const a = document.createElement('a');
a.href = url;
a.download = 'resume.pdf';
a.click();`}</CodeBlock>
                  </div>
                </EndpointCard>
              </TabsContent>

              <TabsContent value="credits" id="credits">
                <EndpointCard
                  method="GET"
                  path="/credits"
                  description="Check your current credit balance"
                  responseBody={`{
  "plan": "pro",
  "plan_credits_remaining": 85,
  "bonus_credits": 10,
  "total_available": 95
}`}
                />
              </TabsContent>

              <TabsContent value="resumes" id="resumes">
                <div className="space-y-4">
                  <EndpointCard
                    method="GET"
                    path="/resumes"
                    description="List your saved resumes"
                    responseBody={`{
  "resumes": [
    {
      "id": "uuid",
      "title": "Software Engineer - Google",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}`}
                  >
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Query Parameters</h4>
                      <div className="text-sm">
                        <code className="bg-muted px-1.5 py-0.5 rounded">limit</code> - Max results (1-100, default: 20)
                      </div>
                      <div className="text-sm">
                        <code className="bg-muted px-1.5 py-0.5 rounded">offset</code> - Pagination offset (default: 0)
                      </div>
                    </div>
                  </EndpointCard>

                  <EndpointCard
                    method="GET"
                    path="/resumes/:id"
                    description="Get a specific resume by ID"
                    responseBody={`{
  "id": "uuid",
  "title": "Software Engineer - Google",
  "job_description": "...",
  "latex_code": "\\\\documentclass{article}...",
  "pdf_url": "https://...",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}`}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Rate Limits */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Rate Limits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4">Limit Type</th>
                        <th className="text-left py-2 pr-4">Default</th>
                        <th className="text-left py-2">Reset</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 pr-4">Per minute</td>
                        <td className="py-2 pr-4">10 requests</td>
                        <td className="py-2">Rolling window</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">Per day</td>
                        <td className="py-2 pr-4">100 requests</td>
                        <td className="py-2">Midnight UTC</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Rate Limit Headers</h4>
                  <p className="text-sm text-muted-foreground">
                    When rate limited, the response includes:
                  </p>
                  <CodeBlock language="json">{`{
  "error": "Rate limit exceeded",
  "limit": 10,
  "window": "1 minute"
}`}</CodeBlock>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* SDKs & Examples */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  Code Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="curl" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                  </TabsList>

                  <TabsContent value="curl">
                    <CodeBlock>{`# Optimize a resume
curl -X POST ${baseUrl}/optimize \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: rs_your_api_key" \\
  -d '{
    "job_description": "Looking for a Full Stack Developer..."
  }'`}</CodeBlock>
                  </TabsContent>

                  <TabsContent value="javascript">
                    <CodeBlock language="javascript">{`const API_KEY = 'rs_your_api_key';
const BASE_URL = '${baseUrl}';

async function optimizeResume(jobDescription) {
  const response = await fetch(\`\${BASE_URL}/optimize\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ job_description: jobDescription }),
  });
  
  if (!response.ok) {
    throw new Error(\`API error: \${response.status}\`);
  }
  
  return response.json();
}

// Usage
const result = await optimizeResume('Looking for a Full Stack Developer...');
console.log(result.latex_code);`}</CodeBlock>
                  </TabsContent>

                  <TabsContent value="python">
                    <CodeBlock language="python">{`import requests

API_KEY = 'rs_your_api_key'
BASE_URL = '${baseUrl}'

def optimize_resume(job_description: str) -> dict:
    response = requests.post(
        f'{BASE_URL}/optimize',
        headers={
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
        },
        json={'job_description': job_description},
    )
    response.raise_for_status()
    return response.json()

# Usage
result = optimize_resume('Looking for a Full Stack Developer...')
print(result['latex_code'])`}</CodeBlock>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Error Codes */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Error Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4">Code</th>
                        <th className="text-left py-2 pr-4">Meaning</th>
                        <th className="text-left py-2">Solution</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 pr-4"><Badge variant="destructive">400</Badge></td>
                        <td className="py-2 pr-4">Bad Request</td>
                        <td className="py-2 text-muted-foreground">Check request body format</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4"><Badge variant="destructive">401</Badge></td>
                        <td className="py-2 pr-4">Unauthorized</td>
                        <td className="py-2 text-muted-foreground">Check API key</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4"><Badge variant="destructive">402</Badge></td>
                        <td className="py-2 pr-4">Payment Required</td>
                        <td className="py-2 text-muted-foreground">Add credits to your account</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4"><Badge variant="destructive">403</Badge></td>
                        <td className="py-2 pr-4">Forbidden</td>
                        <td className="py-2 text-muted-foreground">Key lacks required permission</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4"><Badge variant="destructive">404</Badge></td>
                        <td className="py-2 pr-4">Not Found</td>
                        <td className="py-2 text-muted-foreground">Check endpoint path</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4"><Badge variant="destructive">429</Badge></td>
                        <td className="py-2 pr-4">Too Many Requests</td>
                        <td className="py-2 text-muted-foreground">Wait and retry, or reduce request rate</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4"><Badge variant="destructive">500</Badge></td>
                        <td className="py-2 pr-4">Server Error</td>
                        <td className="py-2 text-muted-foreground">Contact support if persistent</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </PageTransition>
    </AppLayout>
  );
}
