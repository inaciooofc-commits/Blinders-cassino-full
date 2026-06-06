import { shell, bindShellActions, cardLink } from '../core/UI.js';
import { isAdmin } from '../core/State.js';
import { PNG } from '../core/PngAssets.js';

export function MenuPage() {
  const categories = [
    ['🏠 Principal', [
      cardLink({ href: '/menu', icon: '⌂', title: 'Menu', desc: 'Categorias principais' }),
      cardLink({ href: '/graphics', icon: '▱', title: 'Gráficos vivos', desc: 'Sistema em tempo real' }),
      cardLink({ href: '/profile', icon: '♛', title: 'Meu perfil', desc: 'Saldo, ID, inventário e histórico' }),
      cardLink({ href: '/login', icon: '⌁', title: 'Trocar conta', desc: 'Entrar novamente' })
    ]],
    ['🎮 Jogos', [
      cardLink({ href: '/games', icon: '▶', title: 'Jogos Reais', desc: 'Crash, roleta, slots e mais' }),
      cardLink({ href: '/game?game=bingo', icon: '#', title: 'Bingo 100', desc: 'Escolha números antes do sorteio' }),
      cardLink({ href: '/game?game=crash', icon: '↗', title: 'Crash Real-Time', desc: 'Multiplicador ao vivo' }),
      cardLink({ href: '/rankings', icon: '🏆', title: 'Rankings', desc: 'Maiores vitórias e saldos' })
    ]],
    ['🏦 Banco e recompensas', [
      cardLink({ href: '/graphics', icon: '◇', title: 'Status IRIS', desc: 'Saldo, cofre e transações' }),
      cardLink({ href: '/bonus', icon: '🎁', title: 'Bônus', desc: 'Códigos e eventos' }),
      cardLink({ href: '/missions', icon: '🎯', title: 'Missões', desc: 'Diárias, semanais e especiais' }),
      cardLink({ href: '/events', icon: '★', title: 'Eventos', desc: 'Eventos em andamento' }),
      cardLink({ href: '/shop', icon: '🛒', title: 'Loja', desc: 'Itens seguros' })
    ]],
    ['💬 Comunidade', [
      cardLink({ href: '/community', icon: '💬', title: 'Chat e amigos', desc: 'Mensagens, amigos e denúncias' }),
      cardLink({ href: '/clans', icon: '⚑', title: 'Clãs', desc: 'Comissárias, cofre e ranking' }),
      cardLink({ href: '/reports', icon: '▤', title: 'Relatórios', desc: 'Resumo para copiar' })
    ]],
    ['🔒 Administração', [
      cardLink({ href: '/admin', icon: '🔒', title: 'Admin Center', desc: 'Centro único de comando', admin: true }),
      cardLink({ href: '/admin/command', icon: '👑', title: 'Módulo de Comando', desc: 'Diagnóstico, auto-repair e Malena oculta', admin: true }),
      cardLink({ href: '/admin/create-account', icon: '➕', title: 'Criar conta', desc: 'Tela com campos reais', admin: true }),
      cardLink({ href: '/admin/deposits', icon: '↥', title: 'Confirmar depósito', desc: 'Campos de código e valor', admin: true })
    ]]
  ];

  return shell(`
    ${steamCarousel()}
    <section class="category-grid">
      ${categories.filter(cat => !cat[0].includes('Administração') || isAdmin()).map(([title, items]) => `
        <article class="category-card">
          <h2>${title}</h2>
          <div class="list-stack">${items.join('')}</div>
        </article>
      `).join('')}
    </section>
  `, {
    title: 'Blinders Cassino',
    subtitle: 'Menu principal com vitrine animada, jogos, Banco IRIS e Admin Center.',
    bg: 'lobby'
  });
}


function steamCarousel() {
  const slides = [
    ['Bem-vindo ao Blinders', 'Aposte com estilo. Domine com honra.', PNG.showcase.welcome, '/games'],
    ['Bônus de Boas-vindas', 'Mais chances, mais bônus, mais honra.', PNG.showcase.bonus, '/bonus'],
    ['Banco IRIS', 'Deposite, guarde e acompanhe seu saldo.', PNG.showcase.irisBank, '/graphics'],
    ['Clube VIP', 'Eventos, benefícios e ranking.', PNG.showcase.vipClub, '/clans'],
    ['Loja em destaque', 'Itens exclusivos e recompensas.', PNG.showcase.shopHighlight, '/shop'],
    ['Torneios exclusivos', 'Mostre sua estratégia e suba no ranking.', PNG.showcase.tournaments, '/reports'],
    ['Chat global', 'Converse, conecte-se e participe.', PNG.showcase.globalChat, '/community'],
    ['Eventos em andamento', 'Participe e vença sua história.', PNG.showcase.events, '/bonus']
  ];

  const cards = [...slides, ...slides].map(([title, desc, img, href]) => `
    <a class="steam-card png-card" href="${href}" style="--steam-bg:url('${img}')">
      <span>${title}</span>
      <small>${desc}</small>
    </a>
  `).join('');

  return `
    <section class="steam-showcase png-showcase">
      <header>
        <h2>🔥 Em destaque</h2>
        <p>Vitrine em PNG com movimento contínuo.</p>
      </header>
      <div class="steam-window">
        <div class="steam-track">${cards}</div>
      </div>
    </section>
  `;
}


export function bindMenuPage() {
  bindShellActions();
}
