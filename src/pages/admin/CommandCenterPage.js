import { adminShell, bindAdminShell } from '../../components/AdminLayout.js';
import { rpc } from '../../api/rpc.js';
import { State } from '../../core/State.js';
import { toast, escapeHtml } from '../../core/UI.js';

export function CommandCenterPage() {
  return adminShell({
    title: 'Módulo de Comando',
    subtitle: 'Centro forte de estabilidade, diagnóstico, auto-repair e Malena oculta.',
    icon: '👑',
    body: `
      <section class="command-grid">
        <article class="command-hero-card">
          <h3>👑 Centro de Comando Blinders</h3>
          <p>Diagnóstico real do Supabase, funções, tabelas, jogos, cofre EMSHBY, anúncios, loja, missões e módulos principais.</p>
          <div class="command-actions">
            <button class="primary" id="runDiagnostics">♡ Rodar diagnóstico</button>
            <button class="primary" id="runRepair">⚒ Auto-repair seguro</button>
            <button class="ghost" id="copyCommandResult">📋 Copiar resultado</button>
          </div>
          <div class="command-result" id="commandResult">Aguardando comando.</div>
        </article>

        <article class="command-side-card">
          <h3>🕶 Malena oculta</h3>
          <p>A Malena não aparece para membros comuns. Ela registra saúde do sistema, aponta erros e sugere correções para o admin.</p>
          <div class="malena-status">
            <span>Modo: <b>oculto</b></span>
            <span>Banco: <b>verificável</b></span>
            <span>Correção: <b>manual segura</b></span>
          </div>
        </article>

        <article class="command-side-card">
          <h3>⚡ Ações rápidas</h3>
          <div class="command-shortcuts">
            <a href="/admin/create-account">➕ Criar conta</a>
            <a href="/admin/deposits">↥ Confirmar depósito</a>
            <a href="/admin/game-rules">🎮 Regras dos jogos</a>
            <a href="/admin/shop">🛒 Loja visual</a>
            <a href="/admin/announcements">📢 Anúncios</a>
            <a href="/admin/settings">⚙️ Sistema</a>
          </div>
        </article>
      </section>

      <section class="command-kpi-grid" id="commandKpis">
        ${['Banco','Funções','Jogos','Loja','Missões','Eventos','Anúncios','Performance'].map(item => `
          <div class="command-kpi">
            <b>${item}</b>
            <span>aguardando</span>
          </div>
        `).join('')}
      </section>
    `
  });
}

export function bindCommandCenterPage() {
  bindAdminShell();

  document.querySelector('#runDiagnostics')?.addEventListener('click', runDiagnostics);
  document.querySelector('#runRepair')?.addEventListener('click', runRepair);
  document.querySelector('#copyCommandResult')?.addEventListener('click', async () => {
    const text = document.querySelector('#commandResult')?.innerText || '';
    await navigator.clipboard?.writeText(text).catch(() => null);
    toast('Resultado copiado', 'good');
  });

  runDiagnostics(false);
}

async function runDiagnostics(showToast = true) {
  const box = document.querySelector('#commandResult');
  if (box) box.innerHTML = '⏳ Consultando saúde do sistema...';

  try {
    const data = await rpc('app_command_center_status', { p_token: State.token });
    renderStatus(data);
    if (showToast) toast('Diagnóstico concluído', 'good');
  } catch (error) {
    if (box) box.innerHTML = `⚠️ ${escapeHtml(error.message)}<br><small>Rode o SQL V13 no Supabase.</small>`;
    toast(error.message, 'bad');
  }
}

async function runRepair() {
  const box = document.querySelector('#commandResult');
  if (box) box.innerHTML = '⚒ Executando auto-repair seguro...';

  try {
    const data = await rpc('app_malena_auto_repair', { p_token: State.token });
    renderStatus(data);
    toast('Auto-repair concluído', 'good');
  } catch (error) {
    if (box) box.innerHTML = `⚠️ ${escapeHtml(error.message)}`;
    toast(error.message, 'bad');
  }
}

function renderStatus(data) {
  const box = document.querySelector('#commandResult');
  const modules = data?.modules || [];
  const suggestions = data?.suggestions || [];

  if (box) {
    box.innerHTML = `
      <h3>✅ Diagnóstico</h3>
      <div class="command-status-list">
        ${modules.map(item => `
          <div class="${item.ok ? 'ok' : 'warn'}">
            <b>${escapeHtml(item.name)}</b>
            <span>${item.ok ? 'OK' : 'Atenção'}</span>
            <small>${escapeHtml(item.detail || '')}</small>
          </div>
        `).join('')}
      </div>
      <h3>🧠 Sugestões Malena</h3>
      <ul>${suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('') || '<li>Nenhuma ação crítica agora.</li>'}</ul>
      <code>${escapeHtml(JSON.stringify(data, null, 2))}</code>
    `;
  }

  const kpis = document.querySelectorAll('#commandKpis .command-kpi span');
  modules.slice(0, kpis.length).forEach((item, i) => {
    kpis[i].textContent = item.ok ? 'OK' : 'atenção';
    kpis[i].className = item.ok ? 'good' : 'bad';
  });
}
