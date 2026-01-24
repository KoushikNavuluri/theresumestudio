import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Resume {
  id: string;
  title: string;
  job_description: string | null;
  latex_code: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useResumes = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResumes = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching resumes:", error);
    } else {
      setResumes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResumes();
  }, [user]);

  // Helper to save a version
  const saveVersion = async (resumeId: string, latexCode: string, jobDescription: string | null) => {
    // Get current max version number
    const { data: existingVersions } = await supabase
      .from("resume_versions")
      .select("version_number")
      .eq("resume_id", resumeId)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion = existingVersions && existingVersions.length > 0 
      ? existingVersions[0].version_number + 1 
      : 1;

    await supabase
      .from("resume_versions")
      .insert({
        resume_id: resumeId,
        version_number: nextVersion,
        latex_code: latexCode,
        job_description: jobDescription,
      });
  };

  const saveResume = async (
    title: string,
    jobDescription: string,
    latexCode: string,
    pdfUrl?: string
  ) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        title,
        job_description: jobDescription,
        latex_code: latexCode,
        pdf_url: pdfUrl,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving resume:", error);
      return null;
    }

    // Save initial version
    if (data && latexCode) {
      await saveVersion(data.id, latexCode, jobDescription);
    }

    await fetchResumes();
    return data;
  };

  const updateResume = async (
    id: string,
    updates: Partial<Pick<Resume, "title" | "job_description" | "latex_code" | "pdf_url">>
  ) => {
    // If latex_code is being updated, save a version first
    if (updates.latex_code) {
      // Get current resume to get job_description
      const { data: currentResume } = await supabase
        .from("resumes")
        .select("job_description")
        .eq("id", id)
        .single();
      
      await saveVersion(id, updates.latex_code, updates.job_description || currentResume?.job_description || null);
    }

    const { error } = await supabase
      .from("resumes")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating resume:", error);
      return false;
    }

    await fetchResumes();
    return true;
  };

  const deleteResume = async (id: string) => {
    const { error } = await supabase
      .from("resumes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting resume:", error);
      return false;
    }

    await fetchResumes();
    return true;
  };

  return { resumes, loading, saveResume, updateResume, deleteResume, refetch: fetchResumes };
};
