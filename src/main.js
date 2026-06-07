import './styles/base.css';
import './styles/v14-anime-casino.css';
import './styles/v14-hotfix.css';
import './styles/games.css';
import './styles/admin.css';
import './styles/animations.css';
import './styles/v14-function-restore.css';

import { route, bootBlindersRuntime } from './core/Router.js';

async function clearOldCacheOnce() {
  try {
    const key = 'blinders_cache_clean_v145';
    if (localStorage.getItem(key) === '1') return;

    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg => reg.unregister().catch(() => null)));
    }

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(name => caches.delete(name).catch(() => null)));
    }

    localStorage.setItem(key, '1');
  } catch (error) {
    console.warn('Cache cleanup skipped:', error);
  }
}

function showFatal(error) {
  console.error(error);
  const app = document.getElementById('app') || document.body;
  app.innerHTML = `
    <main class="v14-error-page">
      <section class="v14-error-card">
        <h1>Erro no Blinders</h1>
        <p>${escapeHtml(error?.message || error || 'Erro desconhecido')}</p>
        <div class="v14-error-actions">
          <button onclick="location.href='/'">Início</button>
          <button onclick="location.reload()">Recarregar</button>
          <button onclick="localStorage.clear();sessionStorage.clear();location.reload()">Limpar dados</button>
        </div>
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

window.addEventListener('error', event => showFatal(event.error || event.message));
window.addEventListener('unhandledrejection', event => showFatal(event.reason || 'Promise rejeitada'));

clearOldCacheOnce()
  .then(() => {
    bootBlindersRuntime();
    route();
  })
  .catch(showFatal);
