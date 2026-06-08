import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile, BetRecord } from '../types';

const demoProfile: UserProfile = {
  id: 'demo',
  display_name: 'ShinobiMaster',
  vip_tier: 'VIP 7',
  balance: 25430.75,
  energy: 85
};

export const useProfile = (userId?: string) => {
  const [profile, setProfile] = useState<UserProfile>(demoProfile);
  const [bets, setBets] = useState<BetRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const client = supabase;

    if (!client || !userId) {
      setProfile(demoProfile);
      setBets([]);
      return;
    }

    setLoading(true);

    try {
      const [{ data: profileData, error: profileError }, { data: betData, error: betError }] =
        await Promise.all([
          client.from('profiles').select('*').eq('id', userId).maybeSingle(),
          client
            .from('bets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(12)
        ]);

      if (profileError) throw profileError;
      if (betError) throw betError;

      if (profileData) setProfile(profileData as UserProfile);
      if (betData) setBets(betData as BetRecord[]);
    } catch (error) {
      console.warn('Falha ao carregar perfil/apostas. Mantendo modo local seguro.', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const client = supabase;

    if (!client || !userId) return;

    const channel = client
      .channel(`profile-balance-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        payload => {
          if (payload.new) setProfile(payload.new as UserProfile);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bets', filter: `user_id=eq.${userId}` },
        payload => {
          setBets(current => [payload.new as BetRecord, ...current].slice(0, 12));
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [userId]);

  return { profile, bets, loading, refresh, setProfile };
};
