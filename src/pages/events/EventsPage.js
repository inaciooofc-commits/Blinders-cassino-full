import { shell, bindShellActions, escapeHtml, toast } from '../../core/UI.js';
import { rpc } from '../../api/rpc.js';

export function EventsPage() {
  return shell(`
    <section class="event-grid" id="eventGrid">
      <article class="premium-card"><h2>★ Eventos</h2><p>Carregando eventos...</p></article>
    </section>
  `, { title: 'Eventos', subtitle: 'Eventos diários, semanais e especiais.', bg: 'lobby' });
}

export function bindEventsPage() {
  bindShellActions();
  loadEvents();
}

async function loadEvents() {
  try {
    const data = await rpc('app_public_events', {});
    const events = data.events || [];
    document.querySelector('#eventGrid').innerHTML = events.length ? events.map(e => `
      <article class="event-card premium-card">
        <span class="event-badge">${escapeHtml(e.eventType || 'especial')}</span>
        <h2>${escapeHtml(e.title)}</h2>
        <p>${escapeHtml(e.description || '')}</p>
        <small>🎁 ${escapeHtml(e.reward || 'Recompensa surpresa')}</small>
      </article>
    `).join('') : '<article class="premium-card"><h2>Nenhum evento ativo</h2><p>Volte em breve.</p></article>';
  } catch (error) {
    toast(error.message, 'bad');
    document.querySelector('#eventGrid').innerHTML = `<article class="premium-card">⚠️ ${escapeHtml(error.message)}</article>`;
  }
}
