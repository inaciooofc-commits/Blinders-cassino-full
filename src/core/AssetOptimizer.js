import { RuntimePerformance } from './RuntimePerformance.js';

const PRELOADED = new Set();

export function lazyPreloadCriticalPngs() {
  const critical = [
    '/assets/png/backgrounds/main-lobby-wide.png',
    '/assets/png/icons/home.png',
    '/assets/png/icons/menu.png',
    '/assets/png/games/blackjack.png',
    '/assets/png/games/bingo.png'
  ];

  const load = () => {
    const list = RuntimePerformance.ultraLow ? critical.slice(0, 2) : critical;
    for (const src of list) preloadImage(src);
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(load, { timeout: 1800 });
  } else {
    setTimeout(load, 600);
  }
}

export function preloadImage(src) {
  if (!src || PRELOADED.has(src)) return;
  PRELOADED.add(src);
  const img = new Image();
  img.decoding = 'async';
  img.loading = 'lazy';
  img.src = src;
}
