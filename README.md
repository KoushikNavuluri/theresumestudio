<p align="center">
  <img src="https://img.icons8.com/fluency/96/resume.png" alt="ResumeStudio Logo" width="96" height="96"/>
</p>

<h1 align="center">✨ ResumeStudio</h1>

<p align="center">
  <strong>AI-powered resume optimization that helps you land interviews</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#screenshots">Screenshots</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwindcss" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=flat-square&logo=supabase" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite" alt="Vite"/>
</p>

---

## 🎯 What is ResumeStudio?

ResumeStudio is a modern web application that uses AI to optimize your resume for specific job descriptions. It analyzes job postings, extracts key requirements, and tailors your resume to maximize ATS (Applicant Tracking System) compatibility—helping you get past automated filters and into interviews.

## ✨ Features

### 🤖 AI-Powered Optimization
- **Smart keyword extraction** from job descriptions
- **Automatic resume tailoring** to match job requirements
- **LaTeX-quality output** for professional formatting

### 📊 Real-Time Analytics
- **ATS Score** — See how well your resume matches the job
- **Keyword Match %** — Track matched vs. missing keywords
- **Actionable suggestions** to improve your resume

### 📄 Professional Output
- **PDF generation** from optimized LaTeX
- **Live preview** of both LaTeX code and rendered PDF
- **Download ready** for immediate submission

### 💾 Resume Management
- **Auto-save** all generated resumes
- **Resume history** with AI-generated titles
- **Load & edit** previous resumes anytime

### 🎨 Custom Templates
- **Create your own** LaTeX templates
- **Set defaults** for consistent styling
- **Full control** over your resume format

### 🔐 User Features
- **Secure authentication** via Supabase
- **Credit system** with promo code support
- **Free/Pro/Premium** tier support

### 📱 Modern UX
- **PWA support** — Install as an app
- **Mobile-first design** — Works on any device
- **Beautiful animations** with Framer Motion
- **Dark/Light mode** support

### 🔌 Developer API
- **RESTful API** for programmatic access
- **API key management** with granular permissions
- **Rate limiting** and usage analytics
- **Full documentation** with code examples

---

## 🔄 How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Paste Job      │ ──▶ │  AI Analyzes    │ ──▶ │  Optimized      │
│  Description    │     │  & Optimizes    │     │  Resume + PDF   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │                 │
                        │  ATS Analytics  │
                        │  & Suggestions  │
                        │                 │
                        └─────────────────┘
```

1. **Paste** a job description
2. **Generate** — AI creates an optimized LaTeX resume
3. **Review** — See ATS score, matched keywords, and suggestions
4. **Download** — Get your PDF and apply!

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Supabase (Auth, Database, Edge Functions) |
| **AI** | OpenAI/Claude via Supabase Edge Functions |
| **PDF** | LaTeX → PDF conversion via edge functions |
| **State** | TanStack Query, React Hooks |
| **Forms** | React Hook Form, Zod validation |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/KoushikNavuluri/theresumestudio.git
cd theresumestudio

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Building for Production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── animations/     # Framer Motion animations
│   └── admin/          # Admin panel components
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication
│   ├── useCredits.ts   # Credit management
│   ├── useResumes.ts   # Resume CRUD
│   └── useTemplates.ts # Template management
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client & types
├── pages/              # Route pages
│   ├── Index.tsx       # Main resume generator
│   ├── Saved.tsx       # Saved resumes
│   ├── Template.tsx    # Template manager
│   ├── Profile.tsx     # User profile & credits
│   └── Auth.tsx        # Authentication
└── lib/                # Utilities
```

---

## 🎨 Key Components

| Component | Description |
|-----------|-------------|
| `JobDescriptionPanel` | Input area for job descriptions |
| `ResumePreviewToggle` | Switch between LaTeX code and PDF preview |
| `ResumeAnalytics` | ATS score, keywords, and suggestions |
| `CreditsDisplay` | User credit balance |
| `SavingOverlay` | Auto-save progress indicator |
| `Onboarding` | First-time user walkthrough |

---

## 🔧 Supabase Edge Functions

The app uses several Supabase Edge Functions:

| Function | Purpose |
|----------|---------|
| `optimize-resume` | AI resume optimization |
| `convert-latex` | LaTeX → PDF conversion |
| `analyze-resume` | ATS scoring & keyword analysis |
| `generate-title` | AI-generated resume titles |
| `redeem-bonus-code` | Promo code redemption |
| `public-api` | Public REST API for developers |

---

## 🔌 API Reference

ResumeStudio provides a REST API for programmatic access to all features.

### Authentication

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/public-api/optimize \
  -H "Content-Type: application/json" \
  -H "x-api-key: rs_your_api_key_here" \
  -d '{"job_description": "..."}'
```

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/optimize` | POST | Generate ATS-optimized resume |
| `/analyze` | POST | Analyze resume ATS compatibility |
| `/convert` | POST | Convert LaTeX to PDF |
| `/credits` | GET | Check credit balance |
| `/resumes` | GET | List saved resumes |
| `/resumes/:id` | GET | Get specific resume |

### Rate Limits

- **Per minute:** 10 requests
- **Per day:** 100 requests

Full API documentation available at `/api/docs` in the app.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Lucide](https://lucide.dev/) for the icon set

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/KoushikNavuluri">Koushik Navuluri</a>
</p>

<p align="center">
  <a href="https://github.com/KoushikNavuluri/theresumestudio/issues">Report Bug</a> •
  <a href="https://github.com/KoushikNavuluri/theresumestudio/issues">Request Feature</a>
</p>
