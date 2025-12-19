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

    await fetchResumes();
    return data;
  };

  const updateResume = async (
    id: string,
    updates: Partial<Pick<Resume, "title" | "job_description" | "latex_code" | "pdf_url">>
  ) => {
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
