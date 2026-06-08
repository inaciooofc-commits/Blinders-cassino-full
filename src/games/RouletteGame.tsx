import { useState } from 'react';
import { motion } from 'framer-motion';
import { roulettePayout } from '../lib/casinoMath';
import type { UserProfile } from '../types';
import { studioAssets } from '../lib/studioAssets';

interface RouletteGameProps {
  profile: UserProfile;
  onSettle: (bet: number, payout: number, result: string) => Promise<void>;
}

export const RouletteGame = ({ profile, onSettle }: RouletteGameProps) => {
  const [bet, setBet] = useState(20);
  const [pick, setPick] = useState(7);
  const [landed, setLanded] = useState(0);
  const [spin, setSpin] = useState(0);
  const [message, setMessage] = useState('Escolha um número e gire a roda.');

  const run = async () => {
    const result = Math.floor(Math.random() * 37);
    setSpin(current => current + 1080 + result * 9.73);
    setLanded(result);
    const outcome = roulettePayout(pick, result, bet);
    setTimeout(async () => {
      setMessage(outcome.payout > 0 ? `Acerto: caiu ${result}. Pagamento ${outcome.payout.toFixed(2)}.` : `Caiu ${result}. Sem pagamento.`);
      await onSettle(bet, outcome.payout, outcome.result);
    }, 1100);
  };

  return (
    <section className="glass-panel rounded-[2rem] p-5" style={{ backgroundImage: `linear-gradient(90deg, rgba(5,2,10,.82), rgba(5,2,10,.48)), url(${studioAssets.backgrounds.control})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="mb-4">
        <p className="text-sm font-bold tracking-[0.22em] text-orange-300">SALÃO UCHIHA</p>
        <h2 className="text-3xl font-black tracking-[0.14em] text-yellow-200">Sharingan Roulette</h2>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid min-h-[420px] place-items-center rounded-3xl border border-yellow-400/20 bg-black/25">
          <motion.div
            animate={{ rotate: spin }}
            transition={{ duration: 1.1, ease: 'circOut' }}
            className="relative grid h-72 w-72 place-items-center rounded-full border-[14px] border-red-800 bg-[conic-gradient(from_0deg,#8b0000,#05020a,#ff4500,#05020a,#8b0000)] shadow-[0_0_44px_rgba(255,69,0,.35)]"
          >
            <div className="grid h-40 w-40 place-items-center rounded-full border border-yellow-300/40 bg-black/80 text-5xl font-black text-yellow-200">
              {landed}
            </div>
          </motion.div>
        </div>
        <aside className="grid gap-3 content-start">
          <label className="grid gap-1 text-sm text-stone-300">Aposta<input className="input-ninja" type="number" value={bet} onChange={e => setBet(Number(e.target.value))} /></label>
          <label className="grid gap-1 text-sm text-stone-300">Número<input className="input-ninja" type="number" value={pick} min={0} max={36} onChange={e => setPick(Number(e.target.value))} /></label>
          <button className="btn-primary" onClick={run}>Girar Sharingan</button>
          <p className="rounded-2xl border border-white/5 bg-black/25 p-4 text-sm text-stone-200">{message}</p>
        </aside>
      </div>
    </section>
  );
};
