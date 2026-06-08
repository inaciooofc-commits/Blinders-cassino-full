export const TopTicker = () => (
  <div className="relative z-20 h-9 overflow-hidden border-b border-yellow-500/20 bg-black/45">
    <div className="flex h-full items-center whitespace-nowrap text-xs font-bold tracking-[0.18em] text-yellow-300" style={{ animation: 'ticker 28s linear infinite' }}>
      <span className="mx-5 text-orange-400">ANÚNCIO GLOBAL:</span>
      <span>Torneio Kage Blackjack às 20:00</span>
      <span className="mx-5 text-orange-500">•</span>
      <span>Novo evento: Caça ao Pergaminho Supremo</span>
      <span className="mx-5 text-orange-500">•</span>
      <span>Dobro de XP nos jogos do Dojo até domingo</span>
      <span className="mx-5 text-orange-500">•</span>
      <span>VIP Torre Hokage com bônus diários</span>
    </div>
  </div>
);
