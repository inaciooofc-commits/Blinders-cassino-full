import { shell, bindShellActions, toast, escapeHtml } from '../../core/UI.js';
import { State } from '../../core/State.js';
import { rpc } from '../../api/rpc.js';

export function ProfilePage() {
  return shell(`
    <section class="profile-layout">
      <article class="profile-card premium-card">
        <div class="profile-avatar">♛</div>
        <h2 id="profileNick">Carregando perfil...</h2>
        <p id="profileSub">Banco IRIS • Blinders Cassino</p>
        <div class="profile-stats" id="profileStats">
          <div><b>Saldo</b><span>--</span></div>
          <div><b>ID amigo</b><span>--</span></div>
          <div><b>Cargo</b><span>--</span></div>
          <div><b>Status</b><span>--</span></div>
        </div>
      </article>

      <article class="premium-card">
        <h2>▩ Inventário visual</h2>
        <p class="muted">Itens seguros: títulos, molduras, badges e fundos de perfil. Ícones fixos para não quebrar o site.</p>
        <div class="inventory-grid" id="inventoryGrid"></div>
      </article>

      <article class="premium-card">
        <h2>📈 Histórico resumido</h2>
        <div class="profile-history" id="profileHistory">Carregando...</div>
      </article>
    </section>
  `, { title: 'Meu Perfil', subtitle: 'Perfil, saldo, ID de amigo e inventário seguro.', bg: 'lobby' });
}

export function bindProfilePage() {
  bindShellActions();
  loadProfile();
}

async function loadProfile() {
  if (!State.token) {
    document.querySelector('#profileNick').textContent = 'Faça login';
    document.querySelector('#profileSub').textContent = 'Entre para ver seu perfil.';
    return;
  }

  try {
    const data = await rpc('app_member_profile', { p_token: State.token });
    document.querySelector('#profileNick').textContent = data.nick || 'Membro';
    document.querySelector('#profileSub').textContent = `${data.iris || 'IRIS'} • ${data.phone || 'telefone não cadastrado'}`;

    const stats = [
      ['Saldo', data.balanceLabel || '0'],
      ['ID amigo', data.friendCode || '--'],
      ['Cargo', data.role || 'user'],
      ['Status', data.status || 'active']
    ];
    document.querySelector('#profileStats').innerHTML = stats.map(([a,b]) => `<div><b>${a}</b><span>${escapeHtml(b)}</span></div>`).join('');

    const items = data.inventory || [];
    document.querySelector('#inventoryGrid').innerHTML = items.length
      ? items.map(item => `<div class="inventory-item"><b>${escapeHtml(item.title || item.item_key)}</b><span>${escapeHtml(item.rarity || 'common')}</span></div>`).join('')
      : '<p class="muted">Nenhum item equipado ainda.</p>';

    document.querySelector('#profileHistory').innerHTML = `
      <div>🎮 Partidas: <b>${data.rounds || 0}</b></div>
      <div>🏆 Vitórias: <b>${data.wins || 0}</b></div>
      <div>💰 Maior prêmio: <b>${escapeHtml(data.bestPrizeLabel || '0')}</b></div>
    `;
  } catch (error) {
    toast(error.message, 'bad');
    document.querySelector('#profileHistory').innerHTML = `⚠️ ${escapeHtml(error.message)}`;
  }
}
