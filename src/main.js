import './styles/base.css';
import './styles/v14-anime-casino.css';
import './styles/v14-function-restore.css';
import './styles/games.css';
import './styles/admin.css';
import './styles/animations.css';
import './styles/v14-hotfix.css';

import { route, bootBlindersRuntime } from './core/Router.js';

function showFatal(error) {
  console.error(error);
  const app = document.getElementById('app') || document.body;
  app.innerHTML = `
    <main class="v14-error-page">
      <section class="v14-error-card">
        <h1>Erro no Blinders</h1>
        <p>${escapeHtml(error?.message || error || 'Erro desconhecido')}</p>
        <button onclick="location.reload()">Recarregar</button>
        <button onclick="localStorage.clear();location.reload()">Limpar dados locais</button>
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

bootBlindersRuntime()
  .then(route)
  .catch(showFatal);
