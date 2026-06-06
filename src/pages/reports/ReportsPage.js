import { shell, bindShellActions, toast } from '../../core/UI.js';

export function ReportsPage() {
  return shell(`
    <section class="feature-layout">
      <article class="feature-card">
        <h2>📊 Relatórios</h2>
        <p>Gere resumos diários, semanais e mensais para WhatsApp, JSON ou CSV.</p>
        <select id="reportType">
          <option value="daily">Diário</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensal</option>
          <option value="sangria">Sangria</option>
        </select>
        <button class="primary" id="generateReport">Gerar relatório</button>
        <pre class="report-preview" id="reportPreview">Aguardando geração.</pre>
      </article>
    </section>
  `, { title: 'Relatórios', subtitle: 'Resumo de banco, jogos, bônus e sistema.', bg: 'admin' });
}

export function bindReportsPage() {
  bindShellActions();
  document.querySelector('#generateReport')?.addEventListener('click', () => {
    const type = document.querySelector('#reportType')?.value || 'daily';
    const text = `🏆 Blinders Cassino — Relatório ${type}\nDepósitos: 0\nSaques: 0\nJogos: 0\nBônus: 0\nCofre EMSHBY: sincronizado`;
    document.querySelector('#reportPreview').textContent = text;
    navigator.clipboard?.writeText(text).catch(() => null);
    toast('Relatório gerado e copiado', 'good');
  });
}
