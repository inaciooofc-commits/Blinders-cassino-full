import { Bus } from './HarmonyBus.js';

export class Preloader {
  constructor() {
    this.assets = [
      '/assets/backgrounds/lobby.svg',
      '/assets/backgrounds/crash.svg',
      '/assets/backgrounds/roulette.svg',
      '/assets/backgrounds/slots.svg',
      '/assets/backgrounds/blackjack.svg',
      '/assets/backgrounds/dice.svg',
      '/assets/backgrounds/bingo.svg',
      '/assets/backgrounds/coin.svg',
      '/assets/backgrounds/scratch.svg',
      '/assets/backgrounds/memory.svg'
    ];
  }

  mount() {
    let el = document.querySelector('.preloader');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'preloader';
    el.innerHTML = `
      <div class="preloader-box">
        <div class="preloader-icon">🏆</div>
        <h2>Renderizando Blinders</h2>
        <p>Carregando engine, gráficos, Banco IRIS e jogos reais...</p>
        <div class="preloader-bar"><span></span></div>
        <div class="preloader-log">🎮 Inicializando módulos...</div>
      </div>`;
    document.body.appendChild(el);
    return el;
  }

  async run() {
    const el = this.mount();
    const bar = el.querySelector('.preloader-bar span');
    const log = el.querySelector('.preloader-log');
    let loaded = 0;

    const timeout = new Promise(resolve => setTimeout(resolve, 3200));
    const assets = Promise.all(this.assets.map(src => new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded += 1;
        const percent = Math.round((loaded / this.assets.length) * 100);
        if (bar) bar.style.width = `${percent}%`;
        if (log) log.textContent = `🧩 Carregando assets... ${percent}%`;
        Bus.emit('preload:progress', { percent, src });
        resolve();
      };
      img.src = src;
    })));

    await Promise.race([assets, timeout]);
    if (bar) bar.style.width = '100%';
    if (log) log.textContent = '✅ Sistema pronto.';
    await new Promise(resolve => setTimeout(resolve, 250));
    el.classList.add('done');
    setTimeout(() => el.remove(), 700);
  }
}
