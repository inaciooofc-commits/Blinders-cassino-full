import type { GameKey } from '../types';

export const formatCoins = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
};

export const clampBet = (amount: number, balance: number) => {
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.min(amount, balance));
};

export const slotPayout = (symbols: string[], bet: number) => {
  const [a, b, c] = symbols;
  if (a === b && b === c) return { payout: bet * 12, result: 'TRIPLE_CHARKA_WIN' };
  if (a === b || b === c || a === c) return { payout: bet * 2.5, result: 'PAIR_WIN' };
  return { payout: 0, result: 'LOSS' };
};

export const roulettePayout = (picked: number, landed: number, bet: number) => {
  if (picked === landed) return { payout: bet * 35, result: 'STRAIGHT_HIT' };
  const pickedEven = picked % 2 === 0;
  const landedEven = landed % 2 === 0;
  if (pickedEven === landedEven) return { payout: bet * 1.8, result: 'PARITY_HIT' };
  return { payout: 0, result: 'LOSS' };
};

export const recordResultLabel = (game: GameKey, payout: number) =>
  payout > 0 ? `${game.toUpperCase()}_WIN` : `${game.toUpperCase()}_LOSS`;
