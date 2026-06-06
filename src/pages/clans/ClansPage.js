import { shell, bindShellActions, toast } from '../../core/UI.js';

export function ClansPage() {
  return shell(`
    <section class="feature-layout">
      <article class="feature-card">
        <h2>⚑ Clãs e Comissárias</h2>
        <p>Criar clã custa 15T. Cada clã tem cofre próprio, líder/comissária, sublíder, chat e ranking.</p>
        <label>Nome do clã <input id="clanName" placeholder="Nome do clã"></label>
        <label>Descrição <textarea id="clanDesc" placeholder="Descrição do clã"></textarea></label>
        <button class="primary" id="createClan">⚑ Solicitar criação do clã</button>
        <div class="admin-action-result" id="clanResult">Aguardando solicitação.</div>
      </article>
      <article class="feature-card">
        <h2>🏆 Ranking de clãs</h2>
        <div class="ranking-list">
          <div><b>1.</b> Blinders</div>
          <div><b>2.</b> IRIS</div>
          <div><b>3.</b> Zarcovi</div>
        </div>
      </article>
    </section>
  `, { title: 'Clãs', subtitle: 'Cofres, rankings, missões e comissárias.', bg: 'admin' });
}

export function bindClansPage() {
  bindShellActions();
  document.querySelector('#createClan')?.addEventListener('click', () => {
    const name = document.querySelector('#clanName')?.value || '';
    document.querySelector('#clanResult').innerHTML = `⚑ Solicitação preparada para o clã: <b>${name || '-'}</b><br>Custo configurado: <b>15T</b>.`;
    toast('Solicitação de clã preparada', 'good');
  });
}
