const STORAGE_KEY = 'blinders_v145_state';

const games = [
  ['roulette', 'Roulette', 'Roleta europeia com zero único, cores, paridade e número cheio.'],
  ['blackjack', 'Blackjack', 'Blackjack natural 3:2, banca para no 17 e empate devolve.'],
  ['bingo', 'Bingo', 'Cartela 1 a 100, 25 bolas únicas e prêmios por acertos.'],
  ['dice', 'Dice', 'Dois dados com alto/baixo, par/ímpar e soma exata.'],
  ['slots', 'Slots 3x3', 'Cinco linhas de pagamento e símbolos por combinação.'],
  ['memory', 'Memory', 'Jogo de pares com até 3 erros permitidos.'],
  ['crash', 'Crash', 'Multiplicador sobe; retire antes da queda.'],
  ['poker', 'Poker', 'Mesa visual com cartas e aposta segura.']
];

const initialState = {
  member: {
    nick: 'KageShinobi',
    iris: 'IRIS-KAGE-777',
    friendCode: 'KS-777',
    phone: '',
    role: 'admin'
  },
  balance: 25430.75,
  locked: 0,
  vipPoints: 12870,
  jackpot: 125347.89,
  transactions: [
    tx('system', 25430.75, 'Saldo inicial Banco IRIS', 'completed')
  ],
  deposits: [],
  withdraws: [],
  transfers: [],
  shop: [],
  inventory: ['VIP Diamante', 'Badge Blinders', 'Moldura Neon'],
  ranking: [
    ['Shinigami_7', 245780],
    ['KageShinobi', 189430],
    ['AzulNeon', 153920],
    ['ShadowBR', 99875],
    ['IrisQueen', 87610]
  ],
  audit: []
};

let state = loadState();

export function bootBlindersRuntime() {
  ensureState();
  window.BlindersRuntime = {
    getState: () => structuredCloneSafe(state),
    reset: () => {
      localStorage.removeItem(STORAGE_KEY);
      state = loadState();
      route();
    }
  };
}

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
    if (path === '/profile') return render(app, profilePage());
    if (path === '/missions') return render(app, missionsPage());
    if (path === '/rankings') return render(app, rankingsPage());
    if (path === '/shop') return render(app, shopPage());
    if (path === '/events') return render(app, eventsPage());
    return render(app, simplePage('Página não encontrada', `Rota não encontrada: ${path}`, 'menu'));
  } catch (error) {
    render(app, errorPage(error));
  }
}

function render(app, html) {
  app.innerHTML = html;
  bindLinks();
  bindCommonActions();
  bindBankActions();
  bindGameActions();
  bindShopActions();
  bindAdminActions();
  updateLiveBadges();
}

function shell({ title, subtitle = '', active = 'menu', body = '' }) {
  return `
    <main class="v14-shell">
      <aside class="v14-sidebar">
        <a class="v14-brand" href="/menu">
          <span class="brand-orb">B</span>
          <span><b>BLINDERS</b><small>CASINO</small></span>
        </a>

        <nav class="v14-nav">
          ${nav('/menu', 'Home', active === 'menu')}
          ${nav('/games', 'Jogos', active === 'games')}
          ${nav('/bank', 'Banco IRIS', active === 'bank')}
          ${nav('/bank?action=transfer', 'Transferências', active === 'transfer')}
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
          <div><span>V14.5 Function Restore ativo • jogos funcionais • Banco IRIS funcional • loja e admin funcionais • saldo atual ${money(state.balance)}</span></div>
        </div>

        <header class="v14-topbar">
          <div class="v14-search">Saldo ${money(state.balance)} • ${escapeHtml(state.member.nick)} • ${escapeHtml(state.member.iris)}</div>
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
          <span>IRIS System • ENGTech Engine • CL Inc. Studio • Saldo ${money(state.balance)}</span>
        </footer>
      </section>
    </main>
    <div class="toast-stack" id="toastStack"></div>`;
}

function nav(href, label, active) {
  return `<a class="${active ? 'active' : ''}" href="${href}"><span class="nav-dot"></span><span>${escapeHtml(label)}</span></a>`;
}

function menuPage() {
  const tiles = games.map(([key, name]) => `
    <a class="v14-game-tile v14-tile-${key}" href="/game?game=${key}">
      <span>${escapeHtml(name)}</span>
      <b>Jogar</b>
    </a>`).join('');

  return shell({
    title: 'Blinders Casino',
    subtitle: 'Dashboard funcional com jogos, Banco IRIS, loja e painel admin.',
    active: 'menu',
    body: `
      <section class="v14-dashboard">
        <article class="v14-main-banner">
          <div>
            <span>BEM-VINDO AO</span>
            <h2>BLINDERS</h2>
            <p>Casino neon com Banco IRIS, jogos e painel de comando.</p>
            <a class="primary-link" href="/games">Jogar agora</a>
          </div>
        </article>

        <article class="v14-side-rank">
          <h2>Ranking semanal</h2>
          <ol>
            ${state.ranking.map(([nick, score]) => `<li><b>${escapeHtml(nick)}</b><span>${formatNumber(score)}</span></li>`).join('')}
          </ol>
          <a class="primary-link" href="/rankings">Ver ranking</a>
        </article>

        <section class="v14-game-row">${tiles}</section>

        <article class="v14-wallet-panel">
          <div>
            <h2>Banco IRIS</h2>
            <p>Saldo total: <b>${money(state.balance)}</b> • Bloqueado: <b>${money(state.locked)}</b></p>
            <nav>
              <a href="/bank?action=deposit">Depositar</a>
              <a href="/bank?action=withdraw">Sacar</a>
              <a href="/bank?action=transfer">Transferir</a>
              <a href="/bank">Histórico</a>
            </nav>
          </div>
        </article>

        <article class="v14-shop-preview">
          <h2>Itens & Loja</h2>
          <p>Inventário: ${state.inventory.length} itens • VIP ${state.vipPoints} pts</p>
          <a class="primary-link" href="/shop">Ir para loja</a>
        </article>
      </section>`
  });
}

function gamesPage() {
  const cards = games.map(([key, name, desc]) => `
    <article class="game-card-v14 game-card-${key}">
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
    subtitle: 'Agora os botões executam regras e movimentam saldo local.',
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
        <article class="game-stage-card v14-game-stage game-stage-${game[0]}">
          <div class="game-table-safe">
            <h2>${escapeHtml(game[1])}</h2>
            <p>${escapeHtml(game[2])}</p>
            <div class="game-demo-area" id="gameDemo">${gameDemo(game[0])}</div>

            <div class="game-control-grid">
              <label>Valor da aposta
                <input id="betAmount" value="150" inputmode="decimal">
              </label>
              ${choiceInput(game[0])}
              <button class="primary" data-play-game="${escapeHtml(game[0])}">Jogar agora</button>
            </div>

            <div class="game-result" id="gameResult">Saldo atual: ${money(state.balance)}</div>
          </div>
        </article>

        <aside class="game-side">
          <section class="panel">
            <h2>Regras</h2>
            <p>${escapeHtml(game[2])}</p>
          </section>
          <section class="panel">
            <h2>Banco IRIS</h2>
            <p>Disponível: <b>${money(state.balance)}</b></p>
            <p>Jackpot: <b>${money(state.jackpot)}</b></p>
            <a class="primary side-link" href="/bank">Abrir banco</a>
          </section>
        </aside>
      </section>`
  });
}

function choiceInput(game) {
  if (game === 'roulette') {
    return `<label>Escolha
      <select id="gameChoice">
        <option value="red">Vermelho</option>
        <option value="black">Preto</option>
        <option value="even">Par</option>
        <option value="odd">Ímpar</option>
        <option value="0">Número 0</option>
        <option value="7">Número 7</option>
        <option value="21">Número 21</option>
      </select>
    </label>`;
  }
  if (game === 'dice') {
    return `<label>Escolha
      <select id="gameChoice">
        <option value="high">Alto 8-12</option>
        <option value="low">Baixo 2-6</option>
        <option value="even">Par</option>
        <option value="odd">Ímpar</option>
        <option value="7">Soma 7</option>
      </select>
    </label>`;
  }
  if (game === 'bingo') {
    return `<label>Números escolhidos
      <input id="gameChoice" value="7,14,21,32,45,58,70,88,93,100">
    </label>`;
  }
  if (game === 'coin') {
    return `<label>Escolha
      <select id="gameChoice"><option value="heads">Cara</option><option value="tails">Coroa</option></select>
    </label>`;
  }
  return `<label>Modo
    <select id="gameChoice"><option value="default">Padrão</option><option value="risk">Risco alto</option></select>
  </label>`;
}

function gameDemo(key, data = null) {
  if (key === 'slots') {
    const symbols = data?.symbols || ['CRYSTAL','SEVEN','CROWN','CARD','VAULT','CHIP','CRYSTAL','SEVEN','CROWN'];
    return `<div class="slots-grid">${symbols.map(s => `<span>${escapeHtml(s)}</span>`).join('')}</div>`;
  }
  if (key === 'blackjack') {
    const player = data?.player || ['A', 'K'];
    const dealer = data?.dealer || ['B'];
    return `<div class="cards-row">${player.map(c => `<span>${escapeHtml(c)}</span>`).join('')} ${dealer.map(c => `<span class="back">${escapeHtml(c)}</span>`).join('')}</div>`;
  }
  if (key === 'roulette') {
    return `<div class="roulette-demo"><b>${data?.number ?? 0}</b></div>`;
  }
  if (key === 'dice') {
    const dice = data?.dice || [4, 3];
    return `<div class="dice-demo"><span>${dice[0]}</span><span>${dice[1]}</span></div>`;
  }
  if (key === 'bingo') {
    const nums = data?.drawn || Array.from({ length: 25 }, (_, i) => i + 1);
    return `<div class="bingo-demo">${nums.slice(0, 25).map(n => `<span>${n}</span>`).join('')}</div>`;
  }
  if (key === 'crash') {
    return `<div class="crash-demo"><b>${data?.multiplier || '1.00'}x</b><small>Crash</small></div>`;
  }
  if (key === 'poker') {
    return `<div class="cards-row"><span>A</span><span>A</span><span>K</span><span>Q</span><span>J</span></div>`;
  }
  return `<div class="generic-demo"><b>${escapeHtml(key.toUpperCase())}</b></div>`;
}

function bankPage(action) {
  const title = action === 'transfer' ? 'Transferência' : action === 'deposit' ? 'Depósito' : action === 'withdraw' ? 'Saque' : 'Banco IRIS';

  return shell({
    title,
    subtitle: 'Carteira funcional: transferência, depósito, saque e histórico.',
    active: action === 'overview' ? 'bank' : action,
    body: `
      <section class="bank-layout">
        <article class="bank-card bank-hero-card">
          <h2>Banco IRIS</h2>
          <p>Membro: <b>${escapeHtml(state.member.nick)}</b> • IRIS: <b>${escapeHtml(state.member.iris)}</b></p>
          <b class="balance-demo">${money(state.balance)}</b>
          <small>Bloqueado em saque: ${money(state.locked)}</small>
        </article>

        <article class="bank-card">
          <h2>Transferência entre membros</h2>
          <label>Destino <input id="transferTo" value="Shinigami_7"></label>
          <label>Valor <input id="transferAmount" value="250"></label>
          <button class="primary" data-bank-action="transfer">Enviar transferência</button>
        </article>

        <article class="bank-card">
          <h2>Depósito</h2>
          <p>Conta destino: <b>EMSHBY</b></p>
          <label>Valor <input id="depositAmount" value="1000"></label>
          <label>Referência <input id="depositReference" value="Comprovante manual"></label>
          <button class="primary" data-bank-action="deposit">Registrar depósito</button>
        </article>

        <article class="bank-card">
          <h2>Saque</h2>
          <label>Valor <input id="withdrawAmount" value="500"></label>
          <label>Destino <input id="withdrawDestination" value="Conta Zarcovi"></label>
          <button class="primary" data-bank-action="withdraw">Solicitar saque</button>
        </article>

        <article class="bank-card bank-history-card">
          <h2>Histórico recente</h2>
          <div class="tx-list">${transactionsHtml()}</div>
        </article>
      </section>`
  });
}

function transactionsHtml() {
  return state.transactions.slice(0, 14).map(item => `
    <div class="tx-row ${escapeHtml(item.type)}">
      <b>${escapeHtml(item.type)}</b>
      <span>${money(item.amount)}</span>
      <small>${escapeHtml(item.description)} • ${escapeHtml(item.status)} • ${escapeHtml(item.time)}</small>
    </div>`).join('') || '<p>Nenhuma transação.</p>';
}

function shopPage() {
  const items = [
    ['Moldura Neon', 350, 'Frame visual roxo/dourado'],
    ['Badge IRIS', 500, 'Insígnia Banco IRIS'],
    ['Título VIP', 750, 'Título especial no perfil'],
    ['Cartão Diamante', 1200, 'Item raro de perfil'],
    ['Tema Anime Azul', 900, 'Tema visual cyber'],
    ['Entrada Torneio', 1500, 'Ticket para evento']
  ];

  return shell({
    title: 'Loja',
    subtitle: 'Compra funcional usando saldo local.',
    active: 'shop',
    body: `<section class="admin-grid">${items.map(([name, price, desc]) => `
      <article class="category-card shop-item">
        <h2>${escapeHtml(name)}</h2>
        <p>${escapeHtml(desc)}</p>
        <b>${money(price)}</b>
        <button class="primary" data-buy-item="${escapeHtml(name)}" data-price="${price}">Comprar</button>
      </article>`).join('')}</section>`
  });
}

function adminPage() {
  const totals = [
    ['Saldo Banco IRIS', money(state.balance)],
    ['Bloqueado', money(state.locked)],
    ['Transações', state.transactions.length],
    ['Depósitos', state.deposits.length],
    ['Saques', state.withdraws.length],
    ['Inventário', state.inventory.length]
  ];

  return shell({
    title: 'Módulo de Comando',
    subtitle: 'Painel funcional para monitorar, corrigir e simular ações.',
    active: 'admin',
    body: `
      <section class="admin-grid">
        ${totals.map(([a,b]) => card(a,b)).join('')}
        <article class="category-card">
          <h2>Ações de sistema</h2>
          <button class="primary" data-admin-action="bonus">Aplicar bônus teste</button>
          <button class="primary" data-admin-action="backup">Gerar backup local</button>
          <button class="primary" data-admin-action="reset">Resetar dados locais</button>
        </article>
        <article class="category-card">
          <h2>Logs</h2>
          <div class="tx-list">${state.audit.slice(0, 8).map(log => `<div class="tx-row"><b>${escapeHtml(log.type)}</b><small>${escapeHtml(log.message)} • ${escapeHtml(log.time)}</small></div>`).join('') || '<p>Sem logs.</p>'}</div>
        </article>
      </section>`
  });
}

function profilePage() {
  return shell({
    title: 'Perfil',
    subtitle: 'Dados funcionais do membro.',
    active: 'profile',
    body: `
      <section class="bank-layout">
        <article class="bank-card">
          <h2>${escapeHtml(state.member.nick)}</h2>
          <p>IRIS: ${escapeHtml(state.member.iris)}</p>
          <p>ID amigo: ${escapeHtml(state.member.friendCode)}</p>
          <p>VIP: ${formatNumber(state.vipPoints)} pontos</p>
          <label>Telefone <input id="phoneInput" value="${escapeHtml(state.member.phone)}" placeholder="xx xxxxx-xxxx"></label>
          <button class="primary" data-save-phone>Salvar telefone</button>
        </article>
        <article class="bank-card">
          <h2>Inventário</h2>
          <div class="tx-list">${state.inventory.map(i => `<div class="tx-row"><b>${escapeHtml(i)}</b><small>Item ativo</small></div>`).join('')}</div>
        </article>
      </section>`
  });
}

function missionsPage() {
  return shell({
    title: 'Missões',
    subtitle: 'Missões funcionais com recompensa.',
    active: 'missions',
    body: `<section class="admin-grid">
      ${missionCard('Login diário', 'Receba 150 ao coletar.', 150)}
      ${missionCard('Jogar 3 partidas', 'Receba 300 ao coletar.', 300)}
      ${missionCard('Usar Banco IRIS', 'Receba 200 ao coletar.', 200)}
      ${missionCard('Entrar em evento', 'Receba 500 ao coletar.', 500)}
    </section>`
  });
}

function missionCard(title, desc, reward) {
  return `<article class="category-card"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(desc)}</p><button class="primary" data-mission="${reward}">Coletar ${money(reward)}</button></article>`;
}

function rankingsPage() {
  return shell({
    title: 'Rankings',
    subtitle: 'Ranking local atualizado por vitórias.',
    active: 'rankings',
    body: `<section class="admin-grid">${state.ranking.map(([nick, score], idx) => `
      <article class="category-card"><h2>#${idx + 1} ${escapeHtml(nick)}</h2><p>Pontos: ${formatNumber(score)}</p></article>`).join('')}</section>`
  });
}

function eventsPage() {
  return shell({
    title: 'Eventos',
    subtitle: 'Eventos com botões funcionais.',
    active: 'events',
    body: `<section class="admin-grid">
      ${eventCard('Torneio Blackjack', 'Hoje às 20:00', 300)}
      ${eventCard('Caça ao Tesouro IRIS', 'Evento de bônus', 250)}
      ${eventCard('Noite do Bingo', 'Prêmios por acerto', 150)}
    </section>`
  });
}

function eventCard(title, desc, fee) {
  return `<article class="category-card"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(desc)}</p><button class="primary" data-event-fee="${fee}">Entrar por ${money(fee)}</button></article>`;
}

function simplePage(title, desc, active) {
  return shell({
    title,
    subtitle: desc,
    active,
    body: `<section class="admin-grid">${card(title, desc)}${card('Status', 'V14.5 funcional ativo.')}${card('Banco', `Saldo ${money(state.balance)}`)}</section>`
  });
}

function card(title, desc) {
  return `<article class="category-card"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(desc)}</p></article>`;
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

function bindCommonActions() {
  document.querySelector('[data-save-phone]')?.addEventListener('click', () => {
    const phone = document.querySelector('#phoneInput')?.value?.trim() || '';
    if (phone && !/^\d{2}\s\d{4,5}-\d{4}$/.test(phone)) {
      return toast('Telefone inválido. Use xx xxxxx-xxxx.', 'bad');
    }
    state.member.phone = phone;
    audit('profile', 'Telefone atualizado.');
    saveState();
    toast('Telefone salvo.', 'good');
  });

  document.querySelectorAll('[data-mission]').forEach(btn => {
    btn.addEventListener('click', () => {
      const reward = Number(btn.dataset.mission || 0);
      state.balance += reward;
      state.vipPoints += Math.round(reward / 10);
      state.transactions.unshift(tx('mission', reward, 'Missão coletada', 'completed'));
      audit('mission', `Missão coletada: ${money(reward)}`);
      saveState();
      toast(`Recompensa recebida: ${money(reward)}`, 'good');
      route();
    });
  });

  document.querySelectorAll('[data-event-fee]').forEach(btn => {
    btn.addEventListener('click', () => {
      const fee = Number(btn.dataset.eventFee || 0);
      if (!spend(fee, 'event', 'Entrada em evento')) return;
      toast(`Entrada confirmada: ${money(fee)}`, 'good');
      route();
    });
  });
}

function bindBankActions() {
  document.querySelector('[data-bank-action="deposit"]')?.addEventListener('click', () => {
    const amount = parseAmount(document.querySelector('#depositAmount')?.value);
    const ref = document.querySelector('#depositReference')?.value || 'Sem referência';
    if (amount <= 0) return toast('Digite um valor de depósito válido.', 'bad');

    state.balance += amount;
    const item = tx('deposit', amount, `Depósito registrado para EMSHBY: ${ref}`, 'approved');
    state.deposits.unshift(item);
    state.transactions.unshift(item);
    audit('deposit', `Depósito aprovado: ${money(amount)}`);
    saveState();
    toast(`Depósito registrado: ${money(amount)}`, 'good');
    route();
  });

  document.querySelector('[data-bank-action="withdraw"]')?.addEventListener('click', () => {
    const amount = parseAmount(document.querySelector('#withdrawAmount')?.value);
    const dest = document.querySelector('#withdrawDestination')?.value || 'Destino não informado';
    if (amount <= 0) return toast('Digite um valor de saque válido.', 'bad');
    if (amount > state.balance) return toast('Saldo insuficiente para saque.', 'bad');

    state.balance -= amount;
    state.locked += amount;
    const item = tx('withdraw', amount, `Saque solicitado para ${dest}`, 'pending');
    state.withdraws.unshift(item);
    state.transactions.unshift(item);
    audit('withdraw', `Saque solicitado: ${money(amount)}`);
    saveState();
    toast(`Saque solicitado: ${money(amount)}`, 'good');
    route();
  });

  document.querySelector('[data-bank-action="transfer"]')?.addEventListener('click', () => {
    const to = document.querySelector('#transferTo')?.value?.trim() || '';
    const amount = parseAmount(document.querySelector('#transferAmount')?.value);
    if (!to) return toast('Digite o destino.', 'bad');
    if (amount <= 0) return toast('Digite um valor válido.', 'bad');
    if (amount > state.balance) return toast('Saldo insuficiente.', 'bad');

    state.balance -= amount;
    const item = tx('transfer', amount, `Transferência enviada para ${to}`, 'completed');
    state.transfers.unshift(item);
    state.transactions.unshift(item);
    audit('transfer', `Transferência enviada para ${to}: ${money(amount)}`);
    saveState();
    toast(`Transferido para ${to}: ${money(amount)}`, 'good');
    route();
  });
}

function bindGameActions() {
  document.querySelector('[data-play-game]')?.addEventListener('click', event => {
    const game = event.currentTarget.dataset.playGame;
    const bet = parseAmount(document.querySelector('#betAmount')?.value);
    const choice = document.querySelector('#gameChoice')?.value || 'default';

    if (bet <= 0) return toast('Digite uma aposta válida.', 'bad');
    if (bet > state.balance) return toast('Saldo insuficiente.', 'bad');

    const result = playGame(game, bet, choice);
    state.balance -= bet;
    let delta = -bet;

    if (result.payout > 0) {
      state.balance += result.payout;
      delta = result.payout - bet;
    }

    state.jackpot += Math.max(1, bet * 0.03);
    state.vipPoints += Math.max(1, Math.round(bet / 25));
    const item = tx(result.win ? 'game_win' : 'game_loss', delta, `${result.title}: ${result.message}`, 'completed');
    state.transactions.unshift(item);

    if (result.win) {
      state.ranking = updateRanking(state.member.nick, Math.round(result.payout));
    }

    audit('game', `${game}: ${result.message}`);
    saveState();

    const demo = document.querySelector('#gameDemo');
    const out = document.querySelector('#gameResult');
    if (demo) demo.innerHTML = gameDemo(game, result.visual);
    if (out) out.innerHTML = `<b>${result.win ? 'Vitória' : 'Derrota'}</b> — ${escapeHtml(result.message)}<br>Saldo atual: ${money(state.balance)}`;

    toast(result.win ? `Ganhou ${money(result.payout)}` : `Perdeu ${money(bet)}`, result.win ? 'good' : 'bad');
  });
}

function bindShopActions() {
  document.querySelectorAll('[data-buy-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.buyItem;
      const price = Number(btn.dataset.price || 0);
      if (!spend(price, 'shop', `Compra: ${item}`)) return;
      state.inventory.unshift(item);
      state.shop.unshift({ item, price, time: now() });
      audit('shop', `Item comprado: ${item}`);
      saveState();
      toast(`Item comprado: ${item}`, 'good');
      route();
    });
  });
}

function bindAdminActions() {
  document.querySelector('[data-admin-action="bonus"]')?.addEventListener('click', () => {
    state.balance += 777;
    state.transactions.unshift(tx('admin_bonus', 777, 'Bônus aplicado pelo admin', 'completed'));
    audit('admin', 'Bônus de teste aplicado.');
    saveState();
    toast('Bônus aplicado.', 'good');
    route();
  });

  document.querySelector('[data-admin-action="backup"]')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'blinders-backup-local.json';
    a.click();
    URL.revokeObjectURL(a.href);
    audit('admin', 'Backup local gerado.');
    saveState();
    toast('Backup gerado.', 'good');
  });

  document.querySelector('[data-admin-action="reset"]')?.addEventListener('click', () => {
    if (!confirm('Resetar dados locais do Blinders?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    toast('Dados resetados.', 'good');
    route();
  });
}

function playGame(game, bet, choice) {
  if (game === 'roulette') return playRoulette(bet, choice);
  if (game === 'blackjack') return playBlackjack(bet);
  if (game === 'bingo') return playBingo(bet, choice);
  if (game === 'dice') return playDice(bet, choice);
  if (game === 'slots') return playSlots(bet);
  if (game === 'memory') return playMemory(bet);
  if (game === 'crash') return playCrash(bet, choice);
  if (game === 'poker') return playPoker(bet);
  return { title: 'Jogo', win: false, payout: 0, message: 'Jogo não encontrado.', visual: {} };
}

function playRoulette(bet, choice) {
  const number = randomInt(0, 36);
  const color = number === 0 ? 'green' : number % 2 ? 'red' : 'black';
  let win = false;
  let mult = 0;

  if (choice === color && number !== 0) { win = true; mult = 2; }
  else if (choice === 'even' && number !== 0 && number % 2 === 0) { win = true; mult = 2; }
  else if (choice === 'odd' && number % 2 === 1) { win = true; mult = 2; }
  else if (/^\d+$/.test(choice) && Number(choice) === number) { win = true; mult = 36; }

  return {
    title: 'Roulette',
    win,
    payout: win ? bet * mult : 0,
    message: `Caiu ${number} ${color}. ${win ? `Pagamento ${mult}x.` : 'Sem prêmio.'}`,
    visual: { number }
  };
}

function playDice(bet, choice) {
  const dice = [randomInt(1, 6), randomInt(1, 6)];
  const total = dice[0] + dice[1];
  let win = false;
  let mult = 0;

  if (choice === 'high' && total >= 8) { win = true; mult = 1.95; }
  else if (choice === 'low' && total <= 6) { win = true; mult = 1.95; }
  else if (choice === 'even' && total % 2 === 0) { win = true; mult = 1.95; }
  else if (choice === 'odd' && total % 2 === 1) { win = true; mult = 1.95; }
  else if (/^\d+$/.test(choice) && Number(choice) === total) { win = true; mult = total === 7 ? 6 : 8; }

  return {
    title: 'Dice',
    win,
    payout: win ? bet * mult : 0,
    message: `Dados ${dice[0]} + ${dice[1]} = ${total}. ${win ? `Pagamento ${mult}x.` : 'Sem prêmio.'}`,
    visual: { dice }
  };
}

function playSlots(bet) {
  const symbols = ['CRYSTAL', 'SEVEN', 'CROWN', 'CARD', 'VAULT', 'CHIP'];
  const result = Array.from({ length: 9 }, () => symbols[randomInt(0, symbols.length - 1)]);
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,4,8],[2,4,6]];
  let mult = 0;
  let wins = 0;

  for (const line of lines) {
    const [a,b,c] = line.map(i => result[i]);
    if (a === b && b === c) {
      wins++;
      mult += a === 'SEVEN' ? 12 : a === 'CRYSTAL' ? 8 : a === 'CROWN' ? 6 : 4;
    }
  }

  if (wins === 0 && (result[3] === result[4] || result[4] === result[5] || result[3] === result[5])) {
    mult = 1.2;
  }

  return {
    title: 'Slots',
    win: mult > 0,
    payout: mult > 0 ? bet * mult : 0,
    message: mult > 0 ? `${wins || 1} combinação. Pagamento ${mult}x.` : 'Nenhuma linha vencedora.',
    visual: { symbols: result }
  };
}

function playBlackjack(bet) {
  const deck = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const player = [draw(deck), draw(deck)];
  const dealer = [draw(deck), draw(deck)];
  let p = handValue(player);
  let d = handValue(dealer);

  while (p < 17 && Math.random() > 0.35) {
    player.push(draw(deck));
    p = handValue(player);
  }

  while (d < 17) {
    dealer.push(draw(deck));
    d = handValue(dealer);
  }

  const natural = player.length === 2 && p === 21;
  let win = false;
  let push = false;
  let mult = 0;

  if (natural) { win = true; mult = 2.5; }
  else if (p > 21) { win = false; }
  else if (d > 21) { win = true; mult = 2; }
  else if (p > d) { win = true; mult = 2; }
  else if (p === d) { push = true; mult = 1; }

  return {
    title: 'Blackjack',
    win: win || push,
    payout: (win || push) ? bet * mult : 0,
    message: `Você ${p} / Banca ${d}. ${natural ? 'Blackjack natural 3:2.' : push ? 'Empate devolve.' : win ? 'Vitória.' : 'Banca venceu.'}`,
    visual: { player, dealer }
  };
}

function playBingo(bet, choice) {
  const picked = String(choice || '')
    .split(',')
    .map(v => Number(v.trim()))
    .filter(n => Number.isInteger(n) && n >= 1 && n <= 100)
    .slice(0, 10);

  while (picked.length < 5) picked.push(randomInt(1, 100));

  const pool = Array.from({ length: 100 }, (_, i) => i + 1);
  const drawn = [];
  while (drawn.length < 25) {
    const idx = randomInt(0, pool.length - 1);
    drawn.push(pool.splice(idx, 1)[0]);
  }

  const hits = picked.filter(n => drawn.includes(n)).length;
  const mult = hits >= 10 ? 25 : hits >= 8 ? 12 : hits >= 6 ? 5 : hits >= 4 ? 2.5 : hits >= 3 ? 1.5 : 0;

  return {
    title: 'Bingo',
    win: mult > 0,
    payout: mult > 0 ? bet * mult : 0,
    message: `${hits} acertos. ${mult > 0 ? `Pagamento ${mult}x.` : 'Sem prêmio.'}`,
    visual: { drawn }
  };
}

function playMemory(bet) {
  const errors = randomInt(0, 5);
  const pairs = randomInt(3, 8);
  const mult = errors <= 3 ? Math.max(1.2, pairs / 2) : 0;

  return {
    title: 'Memory',
    win: mult > 0,
    payout: mult > 0 ? bet * mult : 0,
    message: `${pairs} pares e ${errors} erros. ${mult > 0 ? `Pagamento ${mult.toFixed(2)}x.` : 'Erros acima do limite.'}`,
    visual: {}
  };
}

function playCrash(bet) {
  const crash = +(1.05 + Math.random() * 7).toFixed(2);
  const cashout = +(1.2 + Math.random() * 3).toFixed(2);
  const win = cashout < crash;

  return {
    title: 'Crash',
    win,
    payout: win ? bet * cashout : 0,
    message: `Cashout ${cashout}x / Crash ${crash}x. ${win ? 'Retirada a tempo.' : 'Caiu antes.'}`,
    visual: { multiplier: cashout.toFixed(2) }
  };
}

function playPoker(bet) {
  const score = randomInt(1, 100);
  const mult = score > 95 ? 10 : score > 84 ? 4 : score > 68 ? 2 : 0;

  return {
    title: 'Poker',
    win: mult > 0,
    payout: mult > 0 ? bet * mult : 0,
    message: mult > 0 ? `Mão vencedora. Pagamento ${mult}x.` : 'Mão sem prêmio.',
    visual: {}
  };
}

function spend(amount, type, description) {
  if (amount <= 0) {
    toast('Valor inválido.', 'bad');
    return false;
  }
  if (amount > state.balance) {
    toast('Saldo insuficiente.', 'bad');
    return false;
  }
  state.balance -= amount;
  state.transactions.unshift(tx(type, -amount, description, 'completed'));
  audit(type, description);
  return true;
}

function updateLiveBadges() {
  document.querySelectorAll('[data-live-balance]').forEach(el => {
    el.textContent = money(state.balance);
  });
}

function parseAmount(value) {
  const raw = String(value || '').trim().toUpperCase().replace(/\s/g, '').replace(',', '.');
  if (!raw) return 0;
  const num = Number(raw.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num)) return 0;
  if (raw.endsWith('T')) return num * 1000000000000;
  if (raw.endsWith('B')) return num * 1000000000;
  return num;
}

function tx(type, amount, description, status = 'completed') {
  return {
    id: cryptoRandom(),
    type,
    amount,
    description,
    status,
    time: now()
  };
}

function audit(type, message) {
  state.audit.unshift({ type, message, time: now() });
  state.audit = state.audit.slice(0, 100);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return structuredCloneSafe(initialState);
    return {
      ...structuredCloneSafe(initialState),
      ...saved,
      member: { ...initialState.member, ...(saved.member || {}) },
      transactions: Array.isArray(saved.transactions) ? saved.transactions : structuredCloneSafe(initialState.transactions),
      ranking: Array.isArray(saved.ranking) ? saved.ranking : structuredCloneSafe(initialState.ranking),
      audit: Array.isArray(saved.audit) ? saved.audit : []
    };
  } catch {
    return structuredCloneSafe(initialState);
  }
}

function ensureState() {
  if (!state || !state.member) state = structuredCloneSafe(initialState);
  saveState();
}

function structuredCloneSafe(value) {
  try { return structuredClone(value); }
  catch { return JSON.parse(JSON.stringify(value)); }
}

function updateRanking(nick, score) {
  const list = [...state.ranking];
  const found = list.find(row => row[0] === nick);
  if (found) found[1] += score;
  else list.push([nick, score]);
  return list.sort((a,b) => b[1] - a[1]).slice(0, 10);
}

function draw(deck) {
  return deck[randomInt(0, deck.length - 1)];
}

function handValue(cards) {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card === 'A') { total += 11; aces++; }
    else if (['J','Q','K'].includes(card)) total += 10;
    else total += Number(card);
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function cryptoRandom() {
  try {
    return crypto.randomUUID();
  } catch {
    return 'id-' + Math.random().toString(16).slice(2);
  }
}

function money(value) {
  const n = Number(value || 0);
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

function now() {
  return new Date().toLocaleString('pt-BR');
}

function toast(message, type = '') {
  let stack = document.querySelector('#toastStack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toastStack';
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2600);
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
