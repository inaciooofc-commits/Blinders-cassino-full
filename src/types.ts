export type GameKey = 'slots' | 'blackjack' | 'roulette' | 'poker' | 'dice';

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  vip_tier: string;
  balance: number;
  energy: number;
  created_at?: string;
}

export interface BetRecord {
  id?: string;
  user_id: string;
  game_key: GameKey;
  bet_amount: number;
  payout: number;
  result: string;
  created_at?: string;
}

export interface GameCard {
  key: GameKey;
  title: string;
  zone: string;
  description: string;
  difficulty: string;
  minBet: number;
  accent: string;
}
