import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Template {
  id: string;
  name: string;
  latex_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);

  const fetchTemplates = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
    } else {
      setTemplates(data || []);
      // Set default template as active
      const defaultTemplate = data?.find(t => t.is_default);
      if (defaultTemplate) {
        setActiveTemplate(defaultTemplate);
      } else if (data && data.length > 0) {
        setActiveTemplate(data[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const saveTemplate = async (name: string, latexCode: string, isDefault: boolean = false) => {
    if (!user) return null;

    // If setting as default, unset other defaults first
    if (isDefault) {
      await supabase
        .from("templates")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const { data, error } = await supabase
      .from("templates")
      .insert({
        user_id: user.id,
        name,
        latex_code: latexCode,
        is_default: isDefault,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving template:", error);
      return null;
    }

    await fetchTemplates();
    return data;
  };

  const updateTemplate = async (
    id: string,
    updates: Partial<Pick<Template, "name" | "latex_code" | "is_default">>
  ) => {
    if (!user) return false;

    // If setting as default, unset other defaults first
    if (updates.is_default) {
      await supabase
        .from("templates")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const { error } = await supabase
      .from("templates")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating template:", error);
      return false;
    }

    await fetchTemplates();
    return true;
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting template:", error);
      return false;
    }

    await fetchTemplates();
    return true;
  };

  const getDefaultTemplate = () => {
    return templates.find(t => t.is_default) || templates[0] || null;
  };

  return { 
    templates, 
    loading, 
    activeTemplate,
    setActiveTemplate,
    saveTemplate, 
    updateTemplate, 
    deleteTemplate, 
    getDefaultTemplate,
    refetch: fetchTemplates 
  };
};
