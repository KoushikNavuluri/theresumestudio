import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface ApiToken {
  id: string;
  name: string;
  token_prefix: string;
  permissions: string[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  last_used_at: string | null;
  requests_today: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface ApiUsageLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  latency_ms: number | null;
  created_at: string;
}

export interface ApiUsageStats {
  total_requests: number;
  requests_today: number;
  avg_latency_ms: number;
  success_rate: number;
  requests_by_endpoint: Record<string, number>;
}

export function useApiTokens() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<ApiUsageStats | null>(null);

  const fetchTokens = useCallback(async () => {
    if (!user) {
      setTokens([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('api_tokens')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens((data as ApiToken[]) || []);
    } catch (error) {
      console.error('Error fetching API tokens:', error);
      toast({
        title: "Error",
        description: "Failed to fetch API tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUsageStats = useCallback(async () => {
    if (!user) return;

    try {
      // Get usage logs from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: logs, error } = await (supabase as any)
        .from('api_usage_logs')
        .select('endpoint, status_code, latency_ms, created_at')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      if (!logs || logs.length === 0) {
        setUsageStats({
          total_requests: 0,
          requests_today: 0,
          avg_latency_ms: 0,
          success_rate: 100,
          requests_by_endpoint: {},
        });
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const requestsToday = logs.filter(
        (log: any) => log.created_at.startsWith(today)
      ).length;

      const successfulRequests = logs.filter(
        (log: any) => log.status_code >= 200 && log.status_code < 300
      ).length;

      const latencies = logs
        .map((log: any) => log.latency_ms)
        .filter((l: any) => l != null) as number[];
      const avgLatency = latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0;

      const byEndpoint: Record<string, number> = {};
      logs.forEach((log: any) => {
        byEndpoint[log.endpoint] = (byEndpoint[log.endpoint] || 0) + 1;
      });

      setUsageStats({
        total_requests: logs.length,
        requests_today: requestsToday,
        avg_latency_ms: avgLatency,
        success_rate: Math.round((successfulRequests / logs.length) * 100),
        requests_by_endpoint: byEndpoint,
      });
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchTokens();
    fetchUsageStats();
  }, [fetchTokens, fetchUsageStats]);

  const generateToken = async (name: string, permissions: string[] = ['optimize', 'analyze', 'convert']) => {
    if (!user) return null;

    try {
      // Generate a secure random token
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const token = 'rs_' + Array.from(tokenBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Hash the token for storage
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const tokenPrefix = token.substring(0, 11); // rs_xxxxxxxx

      const { data: newToken, error } = await (supabase as any)
        .from('api_tokens')
        .insert({
          user_id: user.id,
          name,
          token_hash: tokenHash,
          token_prefix: tokenPrefix,
          permissions,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "API Key Created",
        description: "Copy your key now — it won't be shown again!",
      });

      await fetchTokens();
      
      // Return the full token (only time it's available)
      return { ...newToken, full_token: token };
    } catch (error) {
      console.error('Error generating token:', error);
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateToken = async (tokenId: string, updates: Partial<ApiToken>) => {
    if (!user) return false;

    try {
      const { error } = await (supabase as any)
        .from('api_tokens')
        .update(updates)
        .eq('id', tokenId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "API Key Updated",
        description: "Your changes have been saved",
      });

      await fetchTokens();
      return true;
    } catch (error) {
      console.error('Error updating token:', error);
      toast({
        title: "Error",
        description: "Failed to update API key",
        variant: "destructive",
      });
      return false;
    }
  };

  const revokeToken = async (tokenId: string) => {
    if (!user) return false;

    try {
      const { error } = await (supabase as any)
        .from('api_tokens')
        .delete()
        .eq('id', tokenId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "API Key Revoked",
        description: "The key has been permanently deleted",
      });

      await fetchTokens();
      return true;
    } catch (error) {
      console.error('Error revoking token:', error);
      toast({
        title: "Error",
        description: "Failed to revoke API key",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleToken = async (tokenId: string, isActive: boolean) => {
    return updateToken(tokenId, { is_active: isActive });
  };

  return {
    tokens,
    loading,
    usageStats,
    generateToken,
    updateToken,
    revokeToken,
    toggleToken,
    refreshTokens: fetchTokens,
    refreshStats: fetchUsageStats,
  };
}
