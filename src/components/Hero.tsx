import { motion } from 'framer-motion';
import { Flame, Play, Shield } from 'lucide-react';
import type { UserProfile } from '../types';
import { formatCoins } from '../lib/casinoMath';

interface HeroProps {
  profile: UserProfile;
  onPlay: () => void;
}

export const Hero = ({ profile, onPlay }: HeroProps) => (
  <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel chakra-glow relative min-h-[420px] overflow-hidden rounded-[2rem] p-6 md:p-10"
    >
      <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at 72% 35%, rgba(255,69,0,.34), transparent 25%), radial-gradient(circle at 30% 78%, rgba(41,169,255,.20), transparent 28%)' }} />
      <div className="relative z-10 max-w-3xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-black/30 px-4 py-2 text-sm text-yellow-200">
          <Flame className="h-4 w-4 text-orange-400" />
          Evento: Caça ao Pergaminho Supremo
        </div>
        <h2 className="text-5xl font-black tracking-[0.18em] text-yellow-200 md:text-7xl">
          BLINDERS
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-8 text-stone-200">
          Um cassino imersivo em estética anime ninja original: jogos, saldo, loja, eventos e ranking em uma vila noturna com chakra, selos e arenas.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button onClick={onPlay} className="btn-primary flex items-center gap-2">
            <Play className="h-5 w-5" />
            Entrar no Lobby
          </button>
          <button className="btn-ghost">Ver Eventos</button>
        </div>
      </div>
      <div className="absolute bottom-8 right-8 hidden h-48 w-48 rounded-full border border-orange-400/30 bg-red-950/30 blur-[1px] md:block" />
    </motion.article>

    <aside className="grid gap-4">
      <section className="glass-panel rounded-[2rem] p-5">
        <p className="text-sm text-stone-400">Shinobi</p>
        <h3 className="text-2xl font-black text-yellow-200">{profile.display_name}</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/30 p-4">
            <p className="text-xs text-stone-400">Saldo</p>
            <strong className="text-xl text-yellow-200">{formatCoins(profile.balance)}</strong>
          </div>
          <div className="rounded-2xl bg-black/30 p-4">
            <p className="text-xs text-stone-400">Energia</p>
            <strong className="text-xl text-cyan-200">{profile.energy}/100</strong>
          </div>
        </div>
      </section>
      <section className="glass-panel rounded-[2rem] p-5">
        <div className="mb-3 flex items-center gap-2 text-yellow-200">
          <Shield className="h-5 w-5" />
          Torre VIP
        </div>
        <p className="text-sm leading-6 text-stone-300">Benefícios diários, multiplicadores de cashback e ranking premium.</p>
      </section>
    </aside>
  </section>
);
