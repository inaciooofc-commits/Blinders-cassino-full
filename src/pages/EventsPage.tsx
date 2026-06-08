import { Trophy } from 'lucide-react';

export const EventsPage = () => (
  <section className="grid gap-4">
    <header>
      <p className="text-sm font-bold tracking-[0.22em] text-orange-300">EVENTOS DA VILA</p>
      <h2 className="text-3xl font-black tracking-[0.14em] text-yellow-200">Shows & Torneios</h2>
    </header>
    {['Torneio Kage Blackjack', 'Caça ao Pergaminho Supremo', 'Semana da Raposa Vermelha'].map((event, index) => (
      <article key={event} className="glass-panel flex flex-col gap-4 rounded-[2rem] p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Trophy className="h-10 w-10 text-yellow-300" />
          <div>
            <h3 className="text-xl font-black text-yellow-200">{event}</h3>
            <p className="text-stone-300">Início em {index + 1}d {index * 4 + 2}h</p>
          </div>
        </div>
        <button className="btn-primary">Participar</button>
      </article>
    ))}
  </section>
);
