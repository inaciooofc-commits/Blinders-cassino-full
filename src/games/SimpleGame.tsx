import { useState } from 'react';
import { recordResultLabel } from '../lib/casinoMath';
import type { GameKey, UserProfile } from '../types';

interface SimpleGameProps {
  gameKey: GameKey;
  profile: UserProfile;
  onSettle: (bet: number, payout: number, result: string) => Promise<void>;
}

const titles: Record<GameKey, string> = {
  slots: 'Rasengan Reels',
  blackjack: 'Kage Blackjack',
  roulette: 'Sharingan Roulette',
  poker: 'Akatsuki Poker',
  dice: 'Kunai Dice'
};

export const SimpleGame = ({ gameKey, onSettle }: SimpleGameProps) => {
  const [bet, setBet] = useState(10);
  const [result, setResult] = useState('Pronto para jogar.');

  const play = async () => {
    const win = Math.random() > 0.55;
    const payout = win ? bet * (1.5 + Math.random() * 3) : 0;
    setResult(win ? `Vitória: ${payout.toFixed(2)} moedas.` : 'Derrota. Tente novamente.');
    await onSettle(bet, payout, recordResultLabel(gameKey, payout));
  };

  return (
    <section className="glass-panel rounded-[2rem] p-5">
      <p className="text-sm font-bold tracking-[0.22em] text-orange-300">MESA RÁPIDA</p>
      <h2 className="text-3xl font-black tracking-[0.14em] text-yellow-200">{titles[gameKey]}</h2>
      <div className="mt-5 grid min-h-[320px] place-items-center rounded-3xl border border-yellow-400/20 bg-black/25">
        <div className="text-center">
          <div className="mx-auto mb-5 grid h-32 w-32 place-items-center rounded-full border border-orange-400/40 bg-red-950/40 text-5xl chakra-glow">忍</div>
          <p className="text-stone-300">{result}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input className="input-ninja md:w-40" type="number" value={bet} onChange={e => setBet(Number(e.target.value))} />
        <button className="btn-primary" onClick={play}>Apostar</button>
      </div>
    </section>
  );
};
