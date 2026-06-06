import './styles/command-v13.css';
import './styles/performance-v12.css';
import { lazyPreloadCriticalPngs } from './core/AssetOptimizer.js';
lazyPreloadCriticalPngs();
import './styles/png-skin.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/games.css';
import './styles/admin.css';
import './styles/animations.css';

import { Preloader } from './core/Preloader.js';
import { route } from './core/Router.js';
import { Bus } from './core/HarmonyBus.js';

async function boot() {
  const preloader = new Preloader();
  route();
  await preloader.run();

  Bus.emit('app:ready', { time: Date.now() });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => null);
  }
}

boot().catch(error => {
  console.error(error);
  document.getElementById('app').innerHTML = `
    <main class="center-page">
      <section class="auth-card">
        <h1>⚠️ Falha ao iniciar</h1>
        <p>${error.message}</p>
        <button onclick="location.reload()">Recarregar</button>
      </section>
    </main>`;
});
