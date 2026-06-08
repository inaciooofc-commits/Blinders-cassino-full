import { motion } from 'framer-motion';
import { gameCards } from '../data/games';
import type { GameKey } from '../types';

interface GameLobbyProps {
  onOpenGame: (game: GameKey) => void;
}

export const GameLobby = ({ onOpenGame }: GameLobbyProps) => (
  <section className="grid gap-5">
    <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-bold tracking-[0.22em] text-orange-300">MAPA DA VILA</p>
        <h2 className="text-3xl font-black tracking-[0.14em] text-yellow-200">Lobby de Jogos</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {['Todos', 'Slots', 'Mesas', 'Ao Vivo', 'VIP'].map(filter => (
          <button key={filter} className="btn-ghost px-4 py-2 text-sm">{filter}</button>
        ))}
      </div>
    </header>

    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {gameCards.map((game, index) => (
        <motion.button
          key={game.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * .04 }}
          whileHover={{ y: -6, scale: 1.015 }}
          onClick={() => onOpenGame(game.key)}
          className="glass-panel group min-h-[240px] overflow-hidden rounded-[2rem] p-0 text-left"
        >
          <div className={`relative h-full min-h-[240px] bg-gradient-to-br ${game.accent}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,.25),transparent_24%),linear-gradient(180deg,transparent,rgba(0,0,0,.72))]" />
            <div className="absolute left-5 top-5 rounded-full border border-yellow-300/25 bg-black/35 px-3 py-1 text-xs font-bold tracking-[0.18em] text-yellow-200">
              {game.zone}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="text-2xl font-black tracking-[0.12em] text-yellow-100">{game.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-200">{game.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full border border-yellow-300/20 bg-black/35 px-3 py-1 text-xs text-stone-200">{game.difficulty}</span>
                <span className="text-sm font-bold text-yellow-200">Min {game.minBet}</span>
              </div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  </section>
);
