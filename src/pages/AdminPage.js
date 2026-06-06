import { shell, bindShellActions, cardLink } from '../core/UI.js';
import { isAdmin } from '../core/State.js';

export function AdminPage() {
  if (!isAdmin()) {
    return shell(`
      <section class="center-message">
        <h2>🔒 Admin Center</h2>
        <p>Entre como dono/admin para acessar o centro de comando.</p>
        <a class="primary" href="/login">🔐 Login</a>
      </section>
    `, { title: 'Acesso reservado', bg: 'admin' });
  }

  const groups = [
    ['👑 Comando', [
      cardLink({ href: '/admin/command', icon: '👑', title: 'Módulo de Comando', desc: 'Diagnóstico, auto-repair e Malena oculta' }),
      cardLink({ href: '/graphics', icon: '📊', title: 'Gráficos vivos', desc: 'Performance e sistema' }),
      cardLink({ href: '/admin/settings', icon: '⚙️', title: 'Configurações', desc: 'Lock, manutenção e modo seguro' }),
      cardLink({ href: '/admin/logs', icon: '☰', title: 'Logs', desc: 'Ações, erros e auditoria' })
    ]],
    ['👤 Contas', [
      cardLink({ href: '/admin/accounts', icon: '👥', title: 'Resumo de contas', desc: 'Membros, status e cargos' }),
      cardLink({ href: '/admin/create-account', icon: '➕', title: 'Criar conta', desc: 'Com telefone e saldo inicial' }),
      cardLink({ href: '/admin/approve-accounts', icon: '✅', title: 'Confirmar contas', desc: 'Aprovar ou suspender' }),
      cardLink({ href: '/admin/permissions', icon: '♜', title: 'Permissões', desc: 'Cargos e acessos' })
    ]],
    ['🏦 Banco IRIS', [
      cardLink({ href: '/admin/iris-control', icon: '🏦', title: 'IRIS Control', desc: 'Carteiras e saldos' }),
      cardLink({ href: '/admin/deposits', icon: '↥', title: 'Depósitos', desc: 'Confirmar EMSHBY' }),
      cardLink({ href: '/admin/withdraws', icon: '↧', title: 'Saques', desc: 'Confirmar retirada' }),
      cardLink({ href: '/admin/vault', icon: '◆', title: 'Cofre EMSHBY', desc: 'Reserva e limite' }),
      cardLink({ href: '/admin/sangria', icon: '⇣', title: 'Sangria', desc: 'Relatório diário' })
    ]],
    ['🎮 Jogos', [
      cardLink({ href: '/games', icon: '🎮', title: 'Lobby dos jogos', desc: 'Testar Pixi' }),
      cardLink({ href: '/admin/game-rules', icon: '⚙️', title: 'Regras', desc: 'Multiplicadores e status' }),
      cardLink({ href: '/admin/game-history', icon: '📈', title: 'Histórico', desc: 'Rodadas e TX' }),
      cardLink({ href: '/admin/game-limits', icon: '⊙', title: 'Limites', desc: 'Risco e cofre' })
    ]],
    ['🎁 Conteúdo', [
      cardLink({ href: '/admin/bonus-codes', icon: '％', title: 'Bônus', desc: 'Códigos e prêmios' }),
      cardLink({ href: '/admin/events', icon: '★', title: 'Eventos', desc: 'Criar eventos' }),
      cardLink({ href: '/admin/shop', icon: '🛒', title: 'Loja visual', desc: 'Itens, estoque e raridade' }),
      cardLink({ href: '/admin/inventory', icon: '▩', title: 'Inventário', desc: 'Itens dos membros' }),
      cardLink({ href: '/admin/announcements', icon: '📢', title: 'Anúncios', desc: 'Ticker do servidor' })
    ]],
    ['💬 Comunidade', [
      cardLink({ href: '/community', icon: '💬', title: 'Chat e amigos', desc: 'Página dos membros' }),
      cardLink({ href: '/admin/chat-control', icon: '✉', title: 'Controle do chat', desc: 'Silenciar e denúncias' }),
      cardLink({ href: '/clans', icon: '⚑', title: 'Clãs', desc: 'Painel público' }),
      cardLink({ href: '/admin/clans', icon: '⚑', title: 'Admin clãs', desc: 'Comissárias e cofres' })
    ]]
  ];

  return shell(`
    <section class="admin-command-banner">
      <div>
        <h2>👑 Módulo de Comando</h2>
        <p>Central forte para manter o Blinders estável, bonito e seguro.</p>
      </div>
      <a class="primary" href="/admin/command">Abrir comando</a>
    </section>
    <section class="admin-grid">
      ${groups.map(([title, items]) => `
        <article class="category-card">
          <h2>${title}</h2>
          <div class="list-stack">${items.join('')}</div>
        </article>
      `).join('')}
    </section>
  `, { title: 'Admin Center', subtitle: 'Centro de comando oficial do Blinders Cassino.', bg: 'admin' });
}

export function bindAdminPage() {
  bindShellActions();
}
