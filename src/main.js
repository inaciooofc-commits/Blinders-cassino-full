import './styles/base.css';
import './styles/release.css';
import './styles/games.css';
import './styles/responsive.css';
import './styles/v3-visual-lock.css';
import './styles/v4-login-pwa.css';
import { boot, route } from './core/Router.js';

function fatal(error) {
  console.error(error);
  const app = document.getElementById('app') || document.body;
  app.innerHTML = `<main class="fatal-page"><section><h1>Blinders encontrou um erro</h1><p>${safe(error?.message || error || 'Erro desconhecido')}</p><button onclick="location.reload()">Recarregar</button></section></main>`;
}
function safe(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
window.addEventListener('error', e => fatal(e.error || e.message));
window.addEventListener('unhandledrejection', e => fatal(e.reason || 'Promise rejeitada'));
boot().then(route).catch(fatal);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => null);
  });
}
