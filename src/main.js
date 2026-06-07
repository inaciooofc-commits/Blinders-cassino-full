import './styles/v14-hotfix.css';
import './styles/v14-anime-casino.css';
import './styles/command-v13.css';
import './styles/performance-v12.css';
import './styles/png-skin.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/games.css';
import './styles/admin.css';
import './styles/animations.css';

import { lazyPreloadCriticalPngs } from './core/AssetOptimizer.js';
import { Preloader } from './core/Preloader.js';
import { route } from './core/Router.js';
import { Bus } from './core/HarmonyBus.js';

async function clearOldCachesAndWorkers() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg => reg.unregister().catch(() => null)));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key).catch(() => null)));
    }
  } catch (error) {
    console.warn('Cache cleanup skipped:', error);
  }
}

function showBootError(error) {
  console.error(error);
  const app = document.getElementById('app') || document.body;
  app.innerHTML = `
    <main class="v14-error-page">
      <section class="v14-error-card">
        <h1>Falha ao abrir o Blinders</h1>
        <p>${escapeHtml(error?.message || error || 'Erro desconhecido')}</p>
        <div class="v14-error-actions">
          <button onclick="location.href='/'">Abrir início</button>
          <button onclick="location.reload()">Recarregar</button>
          <button onclick="localStorage.clear(); sessionStorage.clear(); location.reload()">Limpar local</button>
        </div>
        <small>Hotfix V14.1: limpeza de cache, fallback SPA e diagnóstico de tela branca.</small>
      </section>
    </main>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]));
}

async function boot() {
  await clearOldCachesAndWorkers();
  lazyPreloadCriticalPngs();

  const preloader = new Preloader();

  try {
    route();
  } catch (error) {
    showBootError(error);
    return;
  }

  try {
    await preloader.run();
  } catch (error) {
    console.warn('Preloader skipped:', error);
  }

  Bus.emit('app:ready', { time: Date.now(), version: 'v14.1-hotfix' });
}

window.addEventListener('error', event => {
  showBootError(event.error || event.message);
});

window.addEventListener('unhandledrejection', event => {
  showBootError(event.reason || 'Promise rejeitada.');
});

boot().catch(showBootError);
