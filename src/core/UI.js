import { State, isAdmin } from './State.js';
import { logout } from '../api/auth.js';
import { PNG } from './PngAssets.js';
import { loadAnnouncements } from './Announcements.js';
import { mountYouTubeRadio } from './YouTubeRadio.js';
import { RuntimePerformance } from './RuntimePerformance.js';

export function shell(content, options = {}) {
  const title = options.title || 'Blinders Cassino';
  const bg = options.bg || 'lobby';
  return `
    ${tickerHtml()}
    <main class="app-shell png-skin" data-bg="${bg}" style="--page-bg:url('${PNG.bg[bg] || PNG.bg.lobby}')">
      <header class="topbar">
        <a class="brand" href="/menu"><img src="/assets/png/icons/home.png" alt=""> <span>Blinders Cassino</span></a>
        <nav>
          <a href="/menu">🏠 Menu</a>
          <a href="/games">🎮 Jogos</a>
          <a href="/graphics">📊 Gráficos</a>
          ${isAdmin() ? '<a href="/admin">🔒 Admin Center</a>' : ''}
          ${State.token ? '<button id="logoutBtn">🚪 Sair</button>' : '<a href="/login">🔐 Entrar</a>'}
        </nav>
      </header>
      <section class="hero">
        <h1>${escapeHtml(title)}</h1>
        ${options.subtitle ? `<p>${escapeHtml(options.subtitle)}</p>` : ''}
      </section>
      ${content}
      <footer class="contact-footer">
        🏆 <b>Blinders Cassino</b><br>
        📱 Suporte/Admin WhatsApp:
        <a href="https://wa.me/5511951289502">5511951289502</a>
        · 🏦 Depósito: EMSHBY · 💎 Banco IRIS
      </footer>
    </main>`;
}

function tickerHtml() {
  const messages = State.announcements?.length ? State.announcements : [
    '🏆 Blinders Cassino online — Banco IRIS ativo.',
    '🎮 Jogos com animação real rodando na engine.',
    '🏦 Depósito: EMSHBY.',
    '📱 Suporte/Admin WhatsApp: 5511951289502.'
  ];

  const spans = [...messages, ...messages, ...messages, ...messages]
    .map(msg => `<span>${escapeHtml(msg)}</span>`)
    .join('');

  return `
    <div class="server-ticker" data-ticker>
      <b>📢 SERVIDOR</b>
      <div class="ticker-window">
        <div class="ticker-track" data-ticker-track>${spans}</div>
      </div>
    </div>`;
}

export function bindShellActions() {
  document.querySelector('#logoutBtn')?.addEventListener('click', logout);
  startTicker();
  loadAnnouncements();
  mountYouTubeRadio();
}

export function startTicker() {
  document.querySelectorAll('[data-ticker]').forEach(ticker => {
    if (ticker.dataset.ready === '1') return;
    ticker.dataset.ready = '1';

    const track = ticker.querySelector('[data-ticker-track]');
    if (!track) return;

    let x = 0;
    let last = performance.now();
    const speed = RuntimePerformance.low ? 26 : 46;

    function frame(now) {
      if (!document.body.contains(ticker)) return;
      const dt = Math.min(48, now - last);
      last = now;

      if (!document.hidden) {
        x -= (speed * dt) / 1000;
        const half = Math.max(track.scrollWidth / 2, 1);
        if (Math.abs(x) > half) x = 0;
        track.style.transform = `translate3d(${x}px,0,0)`;
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  });
}

export function cardLink({ href, icon, title, desc, admin }) {
  return `
    <a class="list-card ${admin ? 'admin-only' : ''}" href="${href}">
      <span class="list-icon">${icon}</span>
      <span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(desc)}</small></span>
      <em>›</em>
    </a>`;
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]));
}

export function toast(message, type = '') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, 3200);
}
