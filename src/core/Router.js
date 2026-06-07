const games = [
  ['roulette', 'Roulette', 'Roleta europeia com zero único, cores, paridade e número cheio.'],
  ['blackjack', 'Blackjack', 'Blackjack natural 3:2, banca para no 17 e empate devolve.'],
  ['bingo', 'Bingo', 'Cartela 1 a 100, 25 bolas únicas e prêmios por acertos.'],
  ['dice', 'Dice', 'Dois dados com alto/baixo, par/ímpar e soma exata.'],
  ['slots', 'Slots 3x3', 'Cinco linhas de pagamento e símbolos por combinação.'],
  ['memory', 'Memory', 'Jogo de pares com até 3 erros permitidos.'],
  ['crash', 'Crash', 'Multiplicador sobe; retire antes da queda.'],
  ['scratch', 'Scratch', 'Raspadinha com faixas de prêmio.']
];

export function route() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Elemento #app não encontrado.');

  const path = location.pathname || '/';
  const query = new URLSearchParams(location.search);

  try {
    if (path === '/' || path === '/menu') return render(app, menuPage());
    if (path === '/games') return render(app, gamesPage());
    if (path === '/game') return render(app, gamePage(query.get('game') || 'roulette'));
    if (path === '/bank') return render(app, bankPage(query.get('action') || 'overview'));
    if (path === '/admin' || path === '/admin/command') return render(app, adminPage());
    if (path === '/profile') return render(app, simplePage('Perfil', 'Perfil do membro, saldo, inventário e histórico.', 'profile'));
    if (path === '/missions') return render(app, simplePage('Missões', 'Missões diárias, semanais e especiais.', 'missions'));
    if (path === '/rankings') return render(app, simplePage('Rankings', 'Maiores vitórias, partidas e saldos.', 'rankings'));
    if (path === '/shop') return render(app, simplePage('Loja', 'Itens visuais seguros, molduras, títulos e badges.', 'shop'));
    if (path === '/events') return render(app, simplePage('Eventos', 'Eventos ativos do Blinders Casino.', 'events'));

    return render(app, simplePage('Página não encontrada', `Rota não encontrada: ${path}`, 'menu'));
  } catch (error) {
    render(app, errorPage(error));
  }
}

function render(app, html) {
  app.innerHTML = html;
  bindLinks();
  bindActions();
}

function shell({ title, subtitle = '', active = 'menu', body = '' }) {
  return `
    <main class="v14-shell" style="--page-bg:linear-gradient(135deg,#040716,#161036,#050713)">
      <aside class="v14-sidebar">
        <a class="v14-brand" href="/menu">
          <span class="brand-orb">B</span>
          <span><b>BLINDERS</b><small>CASINO</small></span>
        </a>

        <nav class="v14-nav">
          ${nav('/menu', 'Home', active === 'menu')}
          ${nav('/games', 'Jogos', active === 'games')}
          ${nav('/bank', 'Banco IRIS', active === 'bank')}
          ${nav('/bank?action=transfer', 'Transferência', active === 'transfer')}
          ${nav('/bank?action=deposit', 'Depósito', active === 'deposit')}
          ${nav('/bank?action=withdraw', 'Saque', active === 'withdraw')}
          ${nav('/shop', 'Loja', active === 'shop')}
          ${nav('/missions', 'Missões', active === 'missions')}
          ${nav('/rankings', 'Ranking', active === 'rankings')}
          ${nav('/profile', 'Perfil', active === 'profile')}
          ${nav('/admin/command', 'Admin', active === 'admin')}
        </nav>
      </aside>

      <section class="v14-main">
        <div class="v14-ticker">
          <b>ANÚNCIO GLOBAL</b>
          <div><span>Build estável ativo • Banco IRIS • Jogos organizados • Cloudflare protegido</span></div>
        </div>

        <header class="v14-topbar">
          <div class="v14-search">Buscar jogos, membros, itens e transações...</div>
          <nav>
            <a href="/missions">Missões</a>
            <a href="/rankings">Ranking</a>
            <a href="/admin/command">Comando</a>
          </nav>
        </header>

        <section class="v14-hero">
          <div>
            <span class="project-signature">BLINDERS CASINO • IRIS SYSTEM • CL INC. STUDIO</span>
            <h1>${escapeHtml(title)}</h1>
            ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
          </div>
        </section>

        ${body}

        <footer class="v14-signature">
          <b>BLINDERS CASINO</b>
          <span>IRIS System • ENGTech Engine • CL Inc. Studio</span>
        </footer>
      </section>
    </main>`;
}

function nav(href, label, active) {
  return `<a class="${active ? 'active' : ''}" href="${href}"><span class="nav-dot"></span><span>${escapeHtml(label)}</span></a>`;
}

function menuPage() {
  const tiles = games.map(([key, name]) => `
    <a class="v14-game-tile" href="/game?game=${key}">
      <span>${escapeHtml(name)}</span>
      <b>Jogar</b>
    </a>`).join('');

  return shell({
    title: 'Blinders Casino',
    subtitle: 'Base estável para Cloudflare Pages.',
    active: 'menu',
    body: `
      <section class="v14-dashboard">
        <article class="v14-main-banner">
          <div>
            <span>BEM-VINDO AO</span>
            <h2>BLINDERS</h2>
            <p>Visual neon, Banco IRIS, jogos e painel de comando.</p>
            <a class="primary-link" href="/games">Jogar agora</a>
          </div>
        </article>

        <article class="v14-side-rank">
          <h2>Ranking semanal</h2>
          <ol>
            <li><b>Shinobi_7</b><span>245.780</span></li>
            <li><b>KageBR</b><span>189.430</span></li>
            <li><b>NeonWolf</b><span>153.920</span></li>
          </ol>
          <a class="primary-link" href="/rankings">Ver ranking</a>
        </article>

        <section class="v14-game-row">${tiles}</section>

        <article class="v14-wallet-panel">
          <div>
            <h2>Banco IRIS</h2>
            <p>Transferência, depósito, saque e histórico.</p>
            <nav>
              <a href="/bank?action=deposit">Depositar</a>
              <a href="/bank?action=withdraw">Sacar</a>
              <a href="/bank?action=transfer">Transferir</a>
            </nav>
          </div>
        </article>

        <article class="v14-shop-preview">
          <h2>Loja e itens</h2>
          <p>Molduras, títulos, badges e itens visuais seguros.</p>
          <a class="primary-link" href="/shop">Abrir loja</a>
        </article>
      </section>`
  });
}

function gamesPage() {
  const cards = games.map(([key, name, desc]) => `
    <article class="game-card-v14">
      <a href="/game?game=${key}">
        <div class="game-card-v14-img"><span>${escapeHtml(name)}</span></div>
        <div class="game-card-v14-body">
          <h2>${escapeHtml(name)}</h2>
          <p>${escapeHtml(desc)}</p>
          <span>RTP revisado</span>
          <b>Jogar</b>
        </div>
      </a>
    </article>`).join('');

  return shell({
    title: 'Jogos',
    subtitle: 'Regras organizadas, telas separadas e layout sem sobreposição.',
    active: 'games',
    body: `<section class="games-showcase-v14">${cards}</section>`
  });
}

function gamePage(key) {
  const game = games.find(g => g[0] === key) || games[0];

  return shell({
    title: game[1],
    subtitle: game[2],
    active: 'games',
    body: `
      <section class="game-layout">
        <article class="game-stage-card v14-game-stage">
          <div class="game-table-safe">
            <h2>${escapeHtml(game[1])}</h2>
            <p>${escapeHtml(game[2])}</p>
            <div class="game-demo-area">${gameDemo(game[0])}</div>
            <button class="primary demo-play">Rodar ação segura</button>
            <div class="game-result" id="gameResult">Aguardando ação.</div>
          </div>
        </article>

        <aside class="game-side">
          <section class="panel">
            <h2>Regras</h2>
            <p>${escapeHtml(game[2])}</p>
          </section>
          <section class="panel">
            <h2>Aposta</h2>
            <label>Valor <input placeholder="1500B ou 1.5T"></label>
            <button class="primary demo-play">Jogar</button>
          </section>
        </aside>
      </section>`
  });
}

function gameDemo(key) {
  if (key === 'slots') return `<div class="slots-grid">${Array.from({ length: 9 }, (_, i) => `<span>${['CRYSTAL','SEVEN','CROWN'][i % 3]}</span>`).join('')}</div>`;
  if (key === 'blackjack') return `<div class="cards-row"><span>A</span><span>K</span><span class="back">B</span></div>`;
  if (key === 'roulette') return `<div class="roulette-demo"><b>0</b></div>`;
  if (key === 'dice') return `<div class="dice-demo"><span>4</span><span>3</span></div>`;
  if (key === 'bingo') return `<div class="bingo-demo">${Array.from({ length: 25 }, (_, i) => `<span>${i + 1}</span>`).join('')}</div>`;
  return `<div class="generic-demo"><b>${escapeHtml(key.toUpperCase())}</b></div>`;
}

function bankPage(action) {
  const title = action === 'transfer' ? 'Transferência' : action === 'deposit' ? 'Depósito' : action === 'withdraw' ? 'Saque' : 'Banco IRIS';

  return shell({
    title,
    subtitle: 'Carteira, transferência, depósito e saque.',
    active: action === 'overview' ? 'bank' : action,
    body: `
      <section class="bank-layout">
        <article class="bank-card bank-hero-card">
          <h2>Banco IRIS</h2>
          <p>Saldo, histórico e transações dos membros.</p>
          <b class="balance-demo">0.00B</b>
        </article>

        <article class="bank-card">
          <h2>Transferência entre membros</h2>
          <label>Destino <input placeholder="Nick, ID amigo ou IRIS"></label>
          <label>Valor <input placeholder="1500B"></label>
          <button class="primary" data-demo-action>Enviar transferência</button>
        </article>

        <article class="bank-card">
          <h2>Depósito</h2>
          <p>Envie para EMSHBY e registre a referência.</p>
          <label>Valor <input placeholder="1500B"></label>
          <label>Referência <input placeholder="Horário, print ou código"></label>
          <button class="primary" data-demo-action>Registrar depósito</button>
        </article>

        <article class="bank-card">
          <h2>Saque</h2>
          <label>Valor <input placeholder="1500B"></label>
          <label>Destino <input placeholder="Conta ou instrução"></label>
          <button class="primary" data-demo-action>Solicitar saque</button>
        </article>
      </section>`
  });
}

function adminPage() {
  const items = [
    ['Sistema', 'Build Cloudflare corrigido e rotas seguras.'],
    ['Banco IRIS', 'Transferências, depósitos e saques.'],
    ['Jogos', 'Regras de casino revisadas.'],
    ['Loja', 'Itens visuais seguros.'],
    ['Malena', 'Diagnóstico oculto e logs internos.'],
    ['Performance', 'Cache limpo e fallback SPA.']
  ];

  return shell({
    title: 'Módulo de Comando',
    subtitle: 'Painel estável para diagnóstico, banco, jogos, loja e sistema.',
    active: 'admin',
    body: `<section class="admin-grid">${items.map(([a,b]) => card(a,b)).join('')}</section>`
  });
}

function simplePage(title, desc, active) {
  return shell({
    title,
    subtitle: desc,
    active,
    body: `<section class="admin-grid">${card(title, desc)}${card('Status', 'Sistema em base estável.')}${card('Próxima etapa', 'Reativar recursos avançados aos poucos.')}</section>`
  });
}

function card(title, desc) {
  return `<article class="category-card"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(desc)}</p><button class="primary" data-demo-action>Abrir</button></article>`;
}

function errorPage(error) {
  return `<main class="v14-error-page"><section class="v14-error-card"><h1>Erro de rota</h1><p>${escapeHtml(error.message || error)}</p><a href="/menu">Voltar</a></section></main>`;
}

function bindLinks() {
  document.querySelectorAll('a[href^="/"]').forEach(a => {
    a.addEventListener('click', event => {
      const href = a.getAttribute('href');
      if (!href) return;
      event.preventDefault();
      history.pushState({}, '', href);
      route();
    });
  });
}

function bindActions() {
  document.querySelectorAll('[data-demo-action], .demo-play').forEach(btn => {
    btn.addEventListener('click', () => {
      const result = document.querySelector('#gameResult');
      if (result) result.textContent = 'Ação executada em modo seguro. Conecte o SQL para registrar no Supabase.';
      btn.classList.add('clicked');
      setTimeout(() => btn.classList.remove('clicked'), 450);
    });
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]));
}

window.addEventListener('popstate', route);
