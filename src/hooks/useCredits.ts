import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface CreditsData {
  credits: number;
  bonus_credits: number;
  plan: string;
  plan_credits_used: number;
  credits_reset_at: string | null;
}

export function useCredits() {
  const { user } = useAuth();
  const [creditsData, setCreditsData] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCreditsData(null);
      setLoading(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('credits, bonus_credits, plan, plan_credits_used, credits_reset_at')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setCreditsData(data);
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('credits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            const newData = payload.new as CreditsData;
            setCreditsData(newData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Total credits available to spend = remaining plan credits + bonus credits
  const getPlanCredits = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 100;
      case 'basic':
        return 100;
      default:
        return 10;
    }
  };

  const planCredits = getPlanCredits(creditsData?.plan || 'free');
  const usedCredits = creditsData?.plan_credits_used || 0;
  const remainingPlanCredits = Math.max(0, planCredits - usedCredits);
  const totalCredits = remainingPlanCredits + (creditsData?.bonus_credits || 0);


  return {
    creditsData,
    loading,
    totalCredits,
    planCredits,
    remainingPlanCredits,
    bonusCredits: creditsData?.bonus_credits || 0,
    plan: creditsData?.plan || 'free'
  };
}
