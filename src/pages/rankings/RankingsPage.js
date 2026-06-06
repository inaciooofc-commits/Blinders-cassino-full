import { shell, bindShellActions, escapeHtml, toast } from '../../core/UI.js';
import { rpc } from '../../api/rpc.js';

export function RankingsPage() {
  return shell(`
    <section class="rankings-layout">
      <article class="premium-card">
        <h2>🏆 Maiores vitórias</h2>
        <div id="rankWins" class="ranking-list">Carregando...</div>
      </article>
      <article class="premium-card">
        <h2>🎮 Mais partidas</h2>
        <div id="rankRounds" class="ranking-list">Carregando...</div>
      </article>
      <article class="premium-card">
        <h2>💰 Maiores saldos</h2>
        <div id="rankBalance" class="ranking-list">Carregando...</div>
      </article>
    </section>
  `, { title: 'Rankings', subtitle: 'Maiores vitórias, partidas e saldos.', bg: 'games' });
}

export function bindRankingsPage() {
  bindShellActions();
  loadRankings();
}

async function loadRankings() {
  try {
    const data = await rpc('app_public_rankings', {});
    render('rankWins', data.bigWins || []);
    render('rankRounds', data.rounds || []);
    render('rankBalance', data.balances || []);
  } catch (error) {
    toast(error.message, 'bad');
    ['rankWins','rankRounds','rankBalance'].forEach(id => document.querySelector(`#${id}`).innerHTML = `⚠️ ${escapeHtml(error.message)}`);
  }
}

function render(id, items) {
  document.querySelector(`#${id}`).innerHTML = items.length
    ? items.map((item, index) => `
      <div class="ranking-row">
        <b>#${index + 1}</b>
        <span>${escapeHtml(item.nick || 'Membro')}</span>
        <em>${escapeHtml(item.value || item.amount || item.score || '0')}</em>
      </div>
    `).join('')
    : '<p class="muted">Sem dados suficientes ainda.</p>';
}
