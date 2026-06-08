import { Crown } from 'lucide-react';

export const VipPage = () => (
  <section className="glass-panel rounded-[2rem] p-8">
    <Crown className="mb-4 h-12 w-12 text-yellow-300" />
    <p className="text-sm font-bold tracking-[0.22em] text-orange-300">TORRE HOKAGE</p>
    <h2 className="text-4xl font-black tracking-[0.14em] text-yellow-200">VIP High Roller</h2>
    <p className="mt-4 max-w-3xl leading-8 text-stone-300">
      Área premium com cashback, torneios privados, salas high-roller e cosméticos exclusivos.
    </p>
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {['Cashback diário', 'Bônus de energia', 'Salas privadas'].map(item => (
        <div key={item} className="rounded-2xl border border-yellow-400/20 bg-black/25 p-5 text-yellow-100">{item}</div>
      ))}
    </div>
  </section>
);
