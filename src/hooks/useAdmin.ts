import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface PromoCode {
  id: string;
  code: string;
  credits: number;
  max_uses: number | null;
  uses: number | null;
  is_active: boolean | null;
  expires_at: string | null;
  created_at: string;
}

interface RecentRedemption {
  id: string;
  created_at: string;
  credits_awarded: number;
  user_email: string;
  code_name: string;
}

interface PromoStats {
  totalCodes: number;
  activeCodes: number;
  totalRedemptions: number;
  creditsDistributed: number;
  topCodes: Array<{ code: string; uses: number; credits: number }>;
  recentRedemptions: RecentRedemption[];
}

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState<PromoStats | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("admin-promo-codes", {
        body: { action: "check-admin" },
      });

      if (error || data?.error) {
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.isAdmin === true);
      }
    } catch (err) {
      console.error("Admin check error:", err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  const fetchCodes = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase.functions.invoke("admin-promo-codes", {
        body: { action: "list" },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCodes(data.codes || []);
    } catch (err) {
      console.error("Fetch codes error:", err);
    }
  }, [isAdmin]);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase.functions.invoke("admin-promo-codes", {
        body: { action: "stats" },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStats(data.stats || null);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  }, [isAdmin]);

  const createCode = useCallback(async (codeData: {
    code: string;
    credits: number;
    max_uses?: number;
    expires_at?: string | null;
  }) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-promo-codes", {
        body: { action: "create", ...codeData },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await fetchCodes();
      return { success: true, code: data.code };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [fetchCodes]);

  const updateCode = useCallback(async (id: string, updates: Partial<PromoCode>) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-promo-codes", {
        body: { action: "update", id, ...updates },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await fetchCodes();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [fetchCodes]);

  const toggleCodeStatus = useCallback(async (id: string, activate: boolean) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-promo-codes", {
        body: { action: activate ? "activate" : "deactivate", id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await fetchCodes();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [fetchCodes]);

  const deleteCode = useCallback(async (id: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-promo-codes", {
        body: { action: "delete", id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await fetchCodes();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [fetchCodes]);

  return {
    isAdmin,
    loading,
    codes,
    stats,
    actionLoading,
    fetchCodes,
    fetchStats,
    createCode,
    updateCode,
    toggleCodeStatus,
    deleteCode,
  };
}
