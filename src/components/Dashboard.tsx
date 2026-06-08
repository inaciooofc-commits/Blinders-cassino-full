import { ArrowDownToLine, ArrowUpFromLine, Banknote, Clock, Trophy } from 'lucide-react';
import type { BetRecord, UserProfile } from '../types';
import { formatCoins } from '../lib/casinoMath';

interface DashboardProps {
  profile: UserProfile;
  bets: BetRecord[];
}

export const Dashboard = ({ profile, bets }: DashboardProps) => (
  <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
    <section className="grid gap-4 md:grid-cols-3">
      <article className="glass-panel rounded-[2rem] p-5">
        <Banknote className="mb-3 h-7 w-7 text-yellow-300" />
        <p className="text-sm text-stone-400">Saldo total</p>
        <strong className="text-3xl text-yellow-200">{formatCoins(profile.balance)}</strong>
      </article>
      <article className="glass-panel rounded-[2rem] p-5">
        <ArrowDownToLine className="mb-3 h-7 w-7 text-emerald-300" />
        <p className="text-sm text-stone-400">Depósitos</p>
        <strong className="text-3xl text-emerald-200">+12.4K</strong>
      </article>
      <article className="glass-panel rounded-[2rem] p-5">
        <ArrowUpFromLine className="mb-3 h-7 w-7 text-orange-300" />
        <p className="text-sm text-stone-400">Saques</p>
        <strong className="text-3xl text-orange-200">4.8K</strong>
      </article>
      <article className="glass-panel rounded-[2rem] p-5 md:col-span-3">
        <h3 className="mb-4 flex items-center gap-2 text-xl font-black text-yellow-200"><Clock className="h-5 w-5" /> Histórico de Apostas</h3>
        <div className="grid gap-2">
          {bets.length === 0 && <p className="text-stone-400">Sem apostas registradas ainda.</p>}
          {bets.map((bet, index) => (
            <div key={`${bet.id ?? index}`} className="grid grid-cols-4 rounded-xl border border-white/5 bg-black/25 p-3 text-sm">
              <span className="font-bold text-yellow-100">{bet.game_key}</span>
              <span>{formatCoins(bet.bet_amount)}</span>
              <span className={bet.payout > 0 ? 'text-emerald-300' : 'text-red-300'}>{formatCoins(bet.payout)}</span>
              <span className="text-right text-stone-400">{bet.result}</span>
            </div>
          ))}
        </div>
      </article>
    </section>

    <aside className="glass-panel rounded-[2rem] p-5">
      <h3 className="mb-4 flex items-center gap-2 text-xl font-black text-yellow-200"><Trophy className="h-5 w-5" /> Ranking Semanal</h3>
      {['ShinobiMaster', 'KageNoYami', 'KazekageBR', 'IrisQueen', 'ShadowBR'].map((name, index) => (
        <div key={name} className="mb-2 flex items-center justify-between rounded-xl bg-black/25 p-3">
          <span className="font-bold text-stone-200">{index + 1}. {name}</span>
          <span className="text-yellow-200">{formatCoins(245780 - index * 28750)}</span>
        </div>
      ))}
    </aside>
  </section>
);
