import { motion } from 'framer-motion';
import { Banknote, Crown, Dice5, Home, LogOut, ScrollText, Shield, ShoppingBag, Star, Trophy, User, Zap } from 'lucide-react';
import type { UserProfile } from '../types';
import { formatCoins } from '../lib/casinoMath';
import { studioAssets } from '../lib/studioAssets';

interface SidebarProps {
  active: string;
  profile: UserProfile;
  onNavigate: (view: string) => void;
  onSignOut: () => void;
}

const items = [
  ['home', 'Vila / Home', Home],
  ['lobby', 'Lobby', Dice5],
  ['slots', 'Slots', Zap],
  ['tables', 'Mesas', ScrollText],
  ['vip', 'Torre VIP', Crown],
  ['shop', 'Loja', ShoppingBag],
  ['profile', 'Perfil', User],
  ['events', 'Eventos', Trophy],
  ['studio', 'Studio Engines', Zap]
] as const;

export const Sidebar = ({ active, profile, onNavigate, onSignOut }: SidebarProps) => (
  <aside className="glass-panel fixed left-3 top-3 z-40 hidden h-[calc(100vh-24px)] w-[260px] rounded-3xl p-4 lg:block">
    <button onClick={() => onNavigate('home')} className="mb-5 grid w-full place-items-center rounded-2xl border border-yellow-400/20 bg-black/25 p-4 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full border border-yellow-300/40 bg-red-950/60 chakra-glow">
        <img src={studioAssets.icons.vip} alt="Blinders" className="h-14 w-14 object-contain" />
      </div>
      <h1 className="mt-3 text-2xl font-black tracking-[0.22em] text-yellow-200">BLINDERS</h1>
      <span className="text-xs tracking-[0.4em] text-orange-300">CASINO</span>
    </button>

    <nav className="grid gap-2">
      {items.map(([key, label, Icon]) => (
        <motion.button
          whileHover={{ x: 4 }}
          key={key}
          onClick={() => onNavigate(key)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
            active === key
              ? 'border border-orange-400/40 bg-orange-600/20 text-yellow-200'
              : 'border border-white/5 bg-white/5 text-stone-300 hover:bg-white/10'
          }`}
        >
          <Icon className="h-5 w-5 text-yellow-400" />
          {label}
        </motion.button>
      ))}
    </nav>

    <section className="absolute bottom-4 left-4 right-4 rounded-2xl border border-yellow-300/20 bg-black/30 p-4">
      <div className="mb-3 flex items-center gap-3">
        <Star className="h-6 w-6 text-yellow-300" />
        <div>
          <p className="text-xs text-stone-400">Saldo Shinobi</p>
          <strong className="text-yellow-200">{formatCoins(profile.balance)}</strong>
        </div>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-orange-500 via-yellow-300 to-green-500" style={{ width: `${profile.energy}%` }} />
      </div>
      <button onClick={onSignOut} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-950/35 py-2 text-sm text-red-200">
        <LogOut className="h-4 w-4" />
        Sair da Vila
      </button>
    </section>
  </aside>
);
