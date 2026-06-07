import { Bus } from './HarmonyBus.js';

export class Preloader {
  constructor() {
    this.assets = [
      '/assets/png/v14/backgrounds/anime-lobby.png',
      '/assets/png/v14/backgrounds/games-void.png',
      '/assets/png/v14/backgrounds/iris-vault.png',
      '/assets/png/v14/games/roulette.png',
      '/assets/png/v14/games/blackjack.png',
      '/assets/png/v14/games/bingo.png',
      '/assets/png/v14/icons/home.png'
    ];
  }

  mount() {
    let el = document.querySelector('.preloader');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'preloader v14-preloader';
    el.innerHTML = `
      <div class="preloader-box">
        <div class="preloader-icon">BLINDERS</div>
        <h2>Inicializando Blinders</h2>
        <p>Carregando IRIS, Pixi Engine e assets V14...</p>
        <div class="preloader-bar"><span></span></div>
        <div class="preloader-log">Preparando sistema...</div>
      </div>`;
    document.body.appendChild(el);
    return el;
  }

  async run() {
    const el = this.mount();
    const bar = el.querySelector('.preloader-bar span');
    const log = el.querySelector('.preloader-log');
    let loaded = 0;

    const timeout = new Promise(resolve => setTimeout(resolve, 1800));
    const assets = Promise.all(this.assets.map(src => new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded += 1;
        const percent = Math.round((loaded / this.assets.length) * 100);
        if (bar) bar.style.width = `${percent}%`;
        if (log) log.textContent = `Carregando assets... ${percent}%`;
        Bus.emit('preload:progress', { percent, src });
        resolve();
      };
      img.src = src;
    })));

    await Promise.race([assets, timeout]);
    if (bar) bar.style.width = '100%';
    if (log) log.textContent = 'Sistema pronto.';
    await new Promise(resolve => setTimeout(resolve, 120));
    el.classList.add('done');
    setTimeout(() => el.remove(), 450);
  }
}
