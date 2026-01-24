import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ResumeVersion {
  id: string;
  resume_id: string;
  version_number: number;
  latex_code: string;
  job_description: string | null;
  created_at: string;
}

export const useResumeVersions = (resumeId: string | null) => {
  const { user } = useAuth();
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVersions = async () => {
    if (!user || !resumeId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("resume_versions")
      .select("*")
      .eq("resume_id", resumeId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching resume versions:", error);
    } else {
      setVersions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVersions();
  }, [user, resumeId]);

  const saveVersion = async (
    resumeId: string,
    latexCode: string,
    jobDescription: string | null
  ) => {
    if (!user) return null;

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

    const { data, error } = await supabase
      .from("resume_versions")
      .insert({
        resume_id: resumeId,
        version_number: nextVersion,
        latex_code: latexCode,
        job_description: jobDescription,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving resume version:", error);
      return null;
    }

    await fetchVersions();
    return data;
  };

  return { versions, loading, saveVersion, refetch: fetchVersions };
};
