import { supabase } from '../lib/supabase';
import type { BetRecord, GameKey, UserProfile } from '../types';

export const useCasinoActions = (profile: UserProfile, setProfile: (profile: UserProfile) => void) => {
  const updateBalance = async (nextBalance: number) => {
    const nextProfile = { ...profile, balance: nextBalance };
    setProfile(nextProfile);

    if (supabase && profile.id !== 'demo') {
      await supabase.from('profiles').update({ balance: nextBalance }).eq('id', profile.id);
    }
  };

  const recordBet = async (gameKey: GameKey, betAmount: number, payout: number, result: string) => {
    const record: BetRecord = {
      user_id: profile.id,
      game_key: gameKey,
      bet_amount: betAmount,
      payout,
      result
    };

    if (supabase && profile.id !== 'demo') {
      await supabase.from('bets').insert(record);
    }
  };

  const settleBet = async (gameKey: GameKey, betAmount: number, payout: number, result: string) => {
    const nextBalance = profile.balance - betAmount + payout;
    await updateBalance(nextBalance);
    await recordBet(gameKey, betAmount, payout, result);
    return nextBalance;
  };

  return { updateBalance, recordBet, settleBet };
};
