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
    if (!supabase || !userId) return;
    setLoading(true);
    const [{ data: profileData }, { data: betData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('bets').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(12)
    ]);

    if (profileData) setProfile(profileData as UserProfile);
    if (betData) setBets(betData as BetRecord[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!supabase || !userId) return;

    const channel = supabase
      .channel(`profile-balance-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, payload => {
        if (payload.new) setProfile(payload.new as UserProfile);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bets', filter: `user_id=eq.${userId}` }, payload => {
        setBets(current => [payload.new as BetRecord, ...current].slice(0, 12));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { profile, bets, loading, refresh, setProfile };
};
