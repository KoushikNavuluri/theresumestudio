import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  url?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  address: string | null;
  summary: string | null;
  skills: string[];
  work_history: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  created_at: string;
  updated_at: string;
}

const defaultProfile: Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  full_name: null,
  email: null,
  phone: null,
  linkedin_url: null,
  github_url: null,
  portfolio_url: null,
  address: null,
  summary: null,
  skills: [],
  work_history: [],
  education: [],
  certifications: [],
};

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user profile:", error);
    } else if (data) {
      setProfile({
        ...data,
        skills: data.skills || [],
        work_history: (data.work_history as unknown as WorkExperience[]) || [],
        education: (data.education as unknown as Education[]) || [],
        certifications: (data.certifications as unknown as Certification[]) || [],
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const saveProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return false;

    setSaving(true);
    
    // Check if profile exists
    const { data: existing } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Convert arrays to JSON-compatible format
    const dbUpdates = {
      ...updates,
      work_history: updates.work_history ? JSON.parse(JSON.stringify(updates.work_history)) : undefined,
      education: updates.education ? JSON.parse(JSON.stringify(updates.education)) : undefined,
      certifications: updates.certifications ? JSON.parse(JSON.stringify(updates.certifications)) : undefined,
    };

    let error;
    
    if (existing) {
      // Update existing profile
      const result = await supabase
        .from("user_profiles")
        .update(dbUpdates)
        .eq("user_id", user.id);
      error = result.error;
    } else {
      // Create new profile
      const result = await supabase
        .from("user_profiles")
        .insert({
          user_id: user.id,
          full_name: updates.full_name || null,
          email: updates.email || null,
          phone: updates.phone || null,
          linkedin_url: updates.linkedin_url || null,
          github_url: updates.github_url || null,
          portfolio_url: updates.portfolio_url || null,
          address: updates.address || null,
          summary: updates.summary || null,
          skills: updates.skills || [],
          work_history: dbUpdates.work_history || [],
          education: dbUpdates.education || [],
          certifications: dbUpdates.certifications || [],
        });
      error = result.error;
    }

    if (error) {
      console.error("Error saving user profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
      setSaving(false);
      return false;
    }

    await fetchProfile();
    toast({
      title: "Profile saved",
      description: "Your professional profile has been updated.",
    });
    setSaving(false);
    return true;
  };

  return { profile, loading, saving, saveProfile, refetch: fetchProfile };
};
