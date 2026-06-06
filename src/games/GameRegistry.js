import { CrashGame } from './CrashGame.js';
import { RouletteGame } from './RouletteGame.js';
import { SlotsGame } from './SlotsGame.js';
import { BlackjackGame } from './BlackjackGame.js';
import { DiceGame } from './DiceGame.js';
import { BingoGame } from './BingoGame.js';
import { CoinGame } from './CoinGame.js';
import { ScratchGame } from './ScratchGame.js';
import { MemoryGame } from './MemoryGame.js';

export const gameRegistry = {
  crash: CrashGame,
  roulette: RouletteGame,
  slots: SlotsGame,
  blackjack: BlackjackGame,
  dice: DiceGame,
  bingo: BingoGame,
  coin: CoinGame,
  scratch: ScratchGame,
  memory: MemoryGame
};

export const gameMeta = {
  crash: { icon: '📈', name: 'Crash Real-Time', bg: 'crash', desc: 'Gráfico subindo ao vivo com cashout.' },
  roulette: { icon: '🎡', name: 'Roleta Real', bg: 'roulette', desc: 'Roda e bolinha girando de verdade.' },
  slots: { icon: '🎰', name: 'Slots Real', bg: 'slots', desc: 'Rolos animados com parada em sequência.' },
  blackjack: { icon: '🃏', name: 'Blackjack Real', bg: 'blackjack', desc: 'Cartas distribuídas uma por uma.' },
  dice: { icon: '🎲', name: 'Dados Real', bg: 'dice', desc: 'Dados rolando e parando.' },
  bingo: { icon: '🔢', name: 'Bingo Real', bg: 'bingo', desc: 'Bolinhas sorteadas ao vivo.' },
  coin: { icon: '🪙', name: 'Cara ou Coroa', bg: 'coin', desc: 'Moeda girando no eixo.' },
  scratch: { icon: '🎫', name: 'Raspadinha', bg: 'scratch', desc: 'Raspagem real com touch/mouse.' },
  memory: { icon: '🧠', name: 'Memória', bg: 'memory', desc: 'Cartas virando com flip.' }
};
