-- Create resume_versions table to track history (keep last 5 per resume)
CREATE TABLE public.resume_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  latex_code TEXT NOT NULL,
  job_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for resume_versions (users can only access versions of their own resumes)
CREATE POLICY "Users can view their own resume versions"
ON public.resume_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.resumes 
    WHERE resumes.id = resume_versions.resume_id 
    AND resumes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create versions for their own resumes"
ON public.resume_versions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.resumes 
    WHERE resumes.id = resume_versions.resume_id 
    AND resumes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own resume versions"
ON public.resume_versions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.resumes 
    WHERE resumes.id = resume_versions.resume_id 
    AND resumes.user_id = auth.uid()
  )
);

-- Create index for efficient lookups
CREATE INDEX idx_resume_versions_resume_id ON public.resume_versions(resume_id);
CREATE INDEX idx_resume_versions_created_at ON public.resume_versions(resume_id, created_at DESC);

-- Create user_profiles table for professional info
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  address TEXT,
  summary TEXT,
  skills TEXT[] DEFAULT '{}',
  work_history JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-cleanup old versions (keep only last 5)
CREATE OR REPLACE FUNCTION public.cleanup_old_resume_versions()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete versions beyond the 5 most recent for this resume
  DELETE FROM public.resume_versions
  WHERE resume_id = NEW.resume_id
  AND id NOT IN (
    SELECT id FROM public.resume_versions
    WHERE resume_id = NEW.resume_id
    ORDER BY created_at DESC
    LIMIT 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to cleanup after each new version
CREATE TRIGGER cleanup_resume_versions_trigger
AFTER INSERT ON public.resume_versions
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_resume_versions();