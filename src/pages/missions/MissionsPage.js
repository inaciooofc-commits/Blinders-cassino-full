import { shell, bindShellActions, toast, escapeHtml } from '../../core/UI.js';
import { State } from '../../core/State.js';
import { rpc } from '../../api/rpc.js';

export function MissionsPage() {
  return shell(`
    <section class="mission-grid" id="missionGrid">
      <article class="premium-card"><h2>🎯 Missões</h2><p>Carregando missões...</p></article>
    </section>
  `, { title: 'Missões', subtitle: 'Missões diárias, semanais e especiais.', bg: 'lobby' });
}

export function bindMissionsPage() {
  bindShellActions();
  loadMissions();
}

async function loadMissions() {
  try {
    const data = await rpc('app_public_missions', { p_token: State.token || '' });
    const missions = data.missions || [];
    document.querySelector('#missionGrid').innerHTML = missions.map(m => `
      <article class="mission-card premium-card">
        <span class="mission-icon">${escapeHtml(m.icon || '🎯')}</span>
        <h2>${escapeHtml(m.title)}</h2>
        <p>${escapeHtml(m.description || '')}</p>
        <div class="mission-progress"><span style="width:${Math.min(100, Number(m.progress || 0))}%"></span></div>
        <small>${m.progress || 0}% • recompensa ${escapeHtml(m.rewardLabel || '0')}</small>
        <button class="primary claimMission" data-key="${escapeHtml(m.key)}">✅ Resgatar</button>
      </article>
    `).join('');

    document.querySelectorAll('.claimMission').forEach(btn => {
      btn.addEventListener('click', () => claimMission(btn.dataset.key));
    });
  } catch (error) {
    document.querySelector('#missionGrid').innerHTML = `<article class="premium-card">⚠️ ${escapeHtml(error.message)}</article>`;
  }
}

async function claimMission(key) {
  if (!State.token) return toast('Faça login para resgatar missão.', 'bad');
  try {
    const data = await rpc('app_claim_mission', { p_token: State.token, p_mission_key: key });
    toast(data.message || 'Missão resgatada', 'good');
    loadMissions();
  } catch (error) {
    toast(error.message, 'bad');
  }
}
