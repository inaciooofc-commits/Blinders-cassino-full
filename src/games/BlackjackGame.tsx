import { useState } from 'react';
import type { UserProfile } from '../types';

interface BlackjackGameProps {
  profile: UserProfile;
  onSettle: (bet: number, payout: number, result: string) => Promise<void>;
}

const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

const draw = () => values[Math.floor(Math.random() * values.length)];

const handValue = (hand: string[]) => {
  let total = 0;
  let aces = 0;
  hand.forEach(card => {
    if (card === 'A') { total += 11; aces += 1; }
    else if (['J','Q','K'].includes(card)) total += 10;
    else total += Number(card);
  });
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
};

export const BlackjackGame = ({ onSettle }: BlackjackGameProps) => {
  const [bet, setBet] = useState(25);
  const [player, setPlayer] = useState<string[]>([]);
  const [dealer, setDealer] = useState<string[]>([]);
  const [message, setMessage] = useState('Inicie uma rodada.');

  const start = () => {
    setPlayer([draw(), draw()]);
    setDealer([draw(), draw()]);
    setMessage('Escolha pedir carta ou parar.');
  };

  const hit = () => {
    const next = [...player, draw()];
    setPlayer(next);
    if (handValue(next) > 21) {
      finish(next, dealer);
    }
  };

  const finish = async (finalPlayer = player, finalDealer = dealer) => {
    let d = [...finalDealer];
    while (handValue(d) < 17) d = [...d, draw()];
    setDealer(d);

    const pTotal = handValue(finalPlayer);
    const dTotal = handValue(d);
    let payout = 0;
    let result = 'BLACKJACK_LOSS';

    if (pTotal <= 21 && (dTotal > 21 || pTotal > dTotal)) {
      payout = pTotal === 21 ? bet * 2.5 : bet * 2;
      result = 'BLACKJACK_WIN';
    } else if (pTotal === dTotal && pTotal <= 21) {
      payout = bet;
      result = 'BLACKJACK_PUSH';
    }

    setMessage(`Você ${pTotal} x Banca ${dTotal}. ${payout > 0 ? `Pagamento ${payout}.` : 'Derrota.'}`);
    await onSettle(bet, payout, result);
  };

  return (
    <section className="glass-panel rounded-[2rem] p-5">
      <div className="mb-4">
        <p className="text-sm font-bold tracking-[0.22em] text-orange-300">ARENA DOS KAGES</p>
        <h2 className="text-3xl font-black tracking-[0.14em] text-yellow-200">Kage Blackjack</h2>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4 rounded-3xl border border-yellow-400/20 bg-black/25 p-5">
          <Hand title="Suas cartas" cards={player} total={handValue(player)} />
          <Hand title="Banca" cards={dealer} total={handValue(dealer)} />
        </div>
        <aside className="grid content-start gap-3">
          <input className="input-ninja" type="number" value={bet} onChange={e => setBet(Number(e.target.value))} />
          <button className="btn-primary" onClick={start}>Nova Rodada</button>
          <button className="btn-ghost" onClick={hit} disabled={player.length === 0}>Pedir Carta</button>
          <button className="btn-ghost" onClick={() => finish()} disabled={player.length === 0}>Parar</button>
          <p className="rounded-2xl border border-white/5 bg-black/25 p-4 text-stone-200">{message}</p>
        </aside>
      </div>
    </section>
  );
};

const Hand = ({ title, cards, total }: { title: string; cards: string[]; total: number }) => (
  <section>
    <div className="mb-2 flex justify-between text-sm text-stone-300">
      <span>{title}</span>
      <span>Total: {total}</span>
    </div>
    <div className="flex flex-wrap gap-3">
      {cards.length === 0 && <span className="text-stone-500">Sem cartas</span>}
      {cards.map((card, index) => (
        <div key={`${card}-${index}`} className="grid h-28 w-20 place-items-center rounded-2xl border border-yellow-300/30 bg-stone-100 text-3xl font-black text-red-950 shadow-xl">
          {card}
        </div>
      ))}
    </div>
  </section>
);
