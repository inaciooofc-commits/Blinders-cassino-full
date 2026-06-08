import type { GameCard } from '../types';

export const gameCards: GameCard[] = [
  {
    key: 'slots',
    title: 'Rasengan Reels',
    zone: 'Forest of Trials',
    description: 'Reels girando com símbolos de chakra, pergaminhos, kunai e bijuu orbs.',
    difficulty: 'Sorte',
    minBet: 10,
    accent: 'from-orange-600 to-red-800'
  },
  {
    key: 'blackjack',
    title: 'Kage Blackjack',
    zone: 'Arena dos Kages',
    description: 'Cartas com selos e estratégia de 21 contra a banca.',
    difficulty: 'Estratégia',
    minBet: 25,
    accent: 'from-yellow-600 to-orange-800'
  },
  {
    key: 'roulette',
    title: 'Sharingan Roulette',
    zone: 'Salão Uchiha',
    description: 'Roleta circular com giro hipnótico, vermelho/preto e apostas especiais.',
    difficulty: 'Sorte',
    minBet: 20,
    accent: 'from-red-700 to-black'
  },
  {
    key: 'poker',
    title: 'Akatsuki Poker',
    zone: 'Covil Vermelho',
    description: 'Mesa high-risk com cartas, blefe e ranking de poder.',
    difficulty: 'Avançado',
    minBet: 50,
    accent: 'from-red-950 to-zinc-950'
  },
  {
    key: 'dice',
    title: 'Kunai Dice',
    zone: 'Dojo dos Dados',
    description: 'Dados energizados com multiplicadores rápidos.',
    difficulty: 'Rápido',
    minBet: 5,
    accent: 'from-emerald-700 to-zinc-950'
  }
];

export const slotSymbols = ['chakra', 'kunai', 'scroll', 'leaf', 'fox', 'eye', 'ramen'];
