import { shell, bindShellActions, toast } from '../../core/UI.js';
import { input } from '../../components/FormComponents.js';

export function BonusPage() {
  return shell(`
    <section class="feature-layout">
      <article class="feature-card">
        <h2>🎁 Resgatar bônus</h2>
        <p>Digite o código enviado pela staff para receber prêmio, item ou evento especial.</p>
        ${input('bonusCode','Código de bônus','Ex: BLINDERS2026')}
        <button class="primary" id="redeemBonus">✅ Resgatar</button>
        <div class="admin-action-result" id="bonusResult">Aguardando código.</div>
      </article>
      <article class="feature-card">
        <h2>✨ Ideias de bônus</h2>
        <ul>
          <li>Bônus diário</li>
          <li>Bônus secreto</li>
          <li>Bônus por clã</li>
          <li>Bônus de evento</li>
          <li>Item + dinheiro</li>
        </ul>
      </article>
    </section>
  `, { title: 'Códigos de bônus', subtitle: 'Recompensas e eventos especiais.', bg: 'lobby' });
}

export function bindBonusPage() {
  bindShellActions();
  document.querySelector('#redeemBonus')?.addEventListener('click', () => {
    const code = document.querySelector('#bonusCode')?.value || '';
    document.querySelector('#bonusResult').innerHTML = `🎁 Código recebido: <b>${code || '-'}</b><br>Integração RPC preparada para app_bonus_redeem.`;
    toast('Bônus preparado para resgate', 'good');
  });
}
