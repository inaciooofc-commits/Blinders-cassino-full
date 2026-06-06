import { shell, bindShellActions } from '../../core/UI.js';

export function SecurityPage() {
  return shell(`
    <section class="category-grid">
      ${[
        ['⌘','PIN IRIS','PIN separado da senha de login'],
        ['◍','Sessões','Sair de todos os dispositivos'],
        ['⛔','Lock','Bloquear login de membros comuns'],
        ['⚒','Manutenção','Mensagem personalizada para membros'],
        ['⊙','Modo seguro','Desativar jogos se algo crítico falhar'],
        ['⧉','Backup','Salvar e restaurar versão segura']
      ].map(([icon,title,desc]) => `
        <article class="category-card">
          <h2>${icon} ${title}</h2>
          <p>${desc}</p>
          <button class="primary">Configurar</button>
        </article>
      `).join('')}
    </section>
  `, { title: 'Segurança', subtitle: 'Lock, manutenção, modo seguro, PIN e backups.', bg: 'admin' });
}

export function bindSecurityPage() {
  bindShellActions();
}
