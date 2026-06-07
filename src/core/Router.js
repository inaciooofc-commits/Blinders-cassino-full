import { IrisSQL } from '../api/irisSql.js';
import { loadLocal, saveLocal, resetLocal } from './LocalStore.js';
import { toast } from '../ui/toast.js';
import { esc, money, parseAmount, now, number } from '../ui/format.js';
import {
  playRoulette,
  playDice,
  playSlots,
  drawCard,
  handValue,
  finishBlackjack,
  drawBingoNumbers,
  scoreBingo,
  playMemory,
  playCrash,
  playPoker
} from '../games/rules.js';

const games = [
  ['roulette', 'Roulette', 'Roleta europeia com zero único, cores, paridade e número cheio.'],
  ['blackjack', 'Blackjack', 'Blackjack com pedir carta, parar, 21 e natural 3:2.'],
  ['bingo', 'Bingo', 'Cartela 1 a 100, sorteio único e prêmios a partir de 3 acertos.'],
  ['dice', 'Dice', 'Dois dados com alto/baixo, par/ímpar e soma exata.'],
  ['slots', 'Slots', 'Grade 3x3 com símbolos e linhas de pagamento.'],
  ['memory', 'Memory', 'Escolha pares com até 3 erros permitidos.'],
  ['crash', 'Crash', 'Multiplicador sobe; retire antes da queda.'],
  ['poker', 'Poker', 'Mesa visual com cartas e payout simples.']
];

const shopItems = [
  ['frame_neon', 'Moldura Neon', 350, 'Frame visual roxo/dourado'],
  ['badge_iris', 'Badge IRIS', 500, 'Insígnia Banco IRIS'],
  ['title_vip', 'Título VIP', 750, 'Título especial no perfil'],
  ['theme_blue', 'Tema Anime Azul', 900, 'Tema cyber azul'],
  ['ticket_event', 'Ticket Evento', 1500, 'Entrada especial'],
  ['diamond_card', 'Cartão Diamante', 2200, 'Item raro de perfil']
];

const missions = [
  ['daily_login', 'Login diário', 150, 'Receba bônus diário.'],
  ['play_three', 'Jogar 3 partidas', 300, 'Recompensa de atividade.'],
  ['use_bank', 'Usar Banco IRIS', 200, 'Movimente sua carteira.'],
  ['enter_event', 'Entrar em evento', 500, 'Participe de evento.'],
  ['win_bingo', 'Ganhar no Bingo', 700, 'Missão especial.'],
  ['win_blackjack', 'Ganhar no Blackjack', 700, 'Missão de mesa.']
];

const events = [
  ['blackjack_tournament', 'Torneio Blackjack', 300, 'Hoje às 20:00'],
  ['bingo_night', 'Noite do Bingo', 150, 'Sorteios em sequência'],
  ['vip_weekend', 'Fim de Semana VIP', 500, 'Bônus e ranking especial'],
  ['iris_treasure', 'Caça ao Tesouro IRIS', 250, 'Evento de exploração']
];

let state = loadLocal();
let currentBlackjack = null;
let currentBingo = null;
let crashTimer = null;

export async function bootBlindersRuntime() {
  showLoading();

  await sleep(120);
  updateLoading(20, 'Carregando IRIS System');

  await sleep(120);
  updateLoading(45, 'Conectando ao Supabase');

  const remote = await IrisSQL.boot(state.member.nick);

  if (remote?.ok) {
    applyRemote(remote);
    state.sqlConnected = true;
    state.sqlMessage = 'Conectado ao Supabase SQL.';
    toast('Supabase SQL conectado.', 'good');
  } else {
    state.sqlConnected = false;
    state.sqlMessage = remote?.message || remote?.error || 'Modo local/fallback ativo.';
  }

  saveLocal(state);

  updateLoading(72, 'Preparando jogos');
  await sleep(120);
  updateLoading(88, 'Renderizando interface');
  await sleep(120);
  updateLoading(100, 'Finalizando Blinders');
  await sleep(160);

  hideLoading();

  window.BlindersRuntime = {
    getState: () => structuredCloneSafe(state),
    sqlStatus: () => IrisSQL.status(),
    sync: syncSql,
    resetLocal: () => {
      state = resetLocal();
      route();
    }
  };
}

export function route() {
  clearInterval(crashTimer);
  const app = document.getElementById('app');
  if (!app) throw new Error('Elemento #app não encontrado.');

  const path = location.pathname || '/';
  const query = new URLSearchParams(location.search);

  try {
    if (path === '/' || path === '/menu') return render(app, menuPage());
    if (path === '/games') return render(app, gamesPage());
    if (path === '/game') return render(app, gamePage(query.get('game') || 'roulette'));
    if (path === '/bank') return render(app, bankPage(query.get('action') || 'overview'));
    if (path === '/shop') return render(app, shopPage());
    if (path === '/missions') return render(app, missionsPage());
    if (path === '/events') return render(app, eventsPage());
    if (path === '/rankings') return render(app, rankingsPage());
    if (path === '/profile') return render(app, profilePage());
    if (path === '/admin' || path === '/admin/command') return render(app, adminPage());
    return render(app, shell({ title: 'Página não encontrada', active: 'menu', body: `<section class="panel"><p>Rota não encontrada: ${esc(path)}</p></section>` }));
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
  startLiveAdminCharts();
}

function shell({ title, subtitle = '', active = 'menu', body = '' }) {
  const sqlBadge = state.sqlConnected ? 'SQL conectado' : 'Modo local';

  return `
    <main class="v14-shell">
      <aside class="v14-sidebar">
        <a class="v14-brand" href="/menu">
          <span class="brand-orb">B</span>
          <span><b>BLINDERS</b><small>CASINO</small></span>
        </a>

        <div class="nav-group-title">Principal</div>
        <nav class="v14-nav">
          ${nav('/menu', 'Home', 'home', active === 'menu')}
          ${nav('/games', 'Jogos', 'games', active === 'games')}
          ${nav('/rankings', 'Ranking', 'ranking', active === 'rankings')}
        </nav>

        <div class="nav-group-title">Banco IRIS</div>
        <nav class="v14-nav">
          ${nav('/bank', 'Carteira', 'bank', active === 'bank')}
          ${nav('/bank?action=deposit', 'Depósito', 'deposit', active === 'deposit')}
          ${nav('/bank?action=withdraw', 'Saque', 'withdraw', active === 'withdraw')}
          ${nav('/bank?action=transfer', 'Transferência', 'transfer', active === 'transfer')}
        </nav>

        <div class="nav-group-title">Comunidade</div>
        <nav class="v14-nav">
          ${nav('/profile', 'Perfil', 'profile', active === 'profile')}
          ${nav('/missions', 'Missões', 'missions', active === 'missions')}
          ${nav('/events', 'Eventos', 'events', active === 'events')}
          ${nav('/shop', 'Loja', 'shop', active === 'shop')}
        </nav>

        <div class="nav-group-title">Administração</div>
        <nav class="v14-nav">
          ${nav('/admin/command', 'Painel Admin', 'admin', active === 'admin')}
        </nav>

        <div class="vip-box">
          <b>STATUS VIP</b>
          <span>DIAMANTE</span>
          <small>${number(state.vipPoints)} pontos</small>
        </div>
      </aside>

      <section class="v14-main">
        <div class="v14-ticker">
          <b>ANÚNCIO GLOBAL</b>
          <div><span>BLINDERS FINAL • ${esc(sqlBadge)} • Banco IRIS ${money(state.balance)} • ${esc(state.sqlMessage)}</span></div>
        </div>

        <header class="v14-topbar">
          <button class="hamburger" data-toggle-menu>Menu</button>
          <div class="v14-search">${esc(state.member.nick)} • ${esc(state.member.iris)} • ${money(state.balance)}</div>
          <nav>
            <button data-music-toggle>Música</button>
            <a href="/admin/command">Comando</a>
          </nav>
        </header>

        <section class="v14-hero">
          <div>
            <span class="project-signature">BLINDERS CASINO • IRIS SYSTEM • ENGTech Engine • CL Inc. Studio</span>
            <h1>${esc(title)}</h1>
            ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
          </div>
        </section>

        ${body}

        <footer class="v14-signature">
          <b>BLINDERS CASINO</b>
          <span>IRIS System • ENGTech Engine • CL Inc. Studio • ${esc(sqlBadge)}</span>
        </footer>
      </section>
    </main>
    <div class="toast-stack" id="toastStack"></div>
    <audio id="ambientAudio" loop preload="none">
      <source src="" type="audio/mpeg">
    </audio>`;
}

function nav(href, label, icon, active) {
  return `<a class="${active ? 'active' : ''}" href="${href}"><span class="nav-dot icon-${icon}"></span><span>${esc(label)}</span></a>`;
}

function menuPage() {
  const tiles = games.map(([key, name]) => `
    <a class="v14-game-tile tile-${key}" href="/game?game=${key}">
      <span>${esc(name)}</span>
      <b>Jogar</b>
    </a>`).join('');

  return shell({
    title: 'Blinders Casino',
    subtitle: 'Simulador cyber/anime com Banco IRIS e Supabase SQL.',
    active: 'menu',
    body: `
      <section class="v14-dashboard">
        <article class="v14-main-banner">
          <div>
            <span>BEM-VINDO AO</span>
            <h2>BLINDERS</h2>
            <p>${esc(state.sqlMessage)}</p>
            <a class="primary-link" href="/games">Jogar agora</a>
          </div>
        </article>

        <article class="v14-side-rank">
          <h2>Ranking semanal</h2>
          <ol>${rankingList()}</ol>
          <a class="primary-link" href="/rankings">Ver ranking</a>
        </article>

        <section class="steam-showcase">
          <div class="steam-track">
            ${games.concat(games).map(([key, name]) => `<img src="/assets/v14/cards/${key}.png" alt="${esc(name)}">`).join('')}
          </div>
        </section>

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
          <h2>Loja e itens</h2>
          <p>Inventário: ${state.inventory.length} itens • VIP ${number(state.vipPoints)} pts</p>
          <a class="primary-link" href="/shop">Abrir loja</a>
        </article>
      </section>`
  });
}

function gamesPage() {
  const cards = games.map(([key, name, desc]) => `
    <article class="game-card-v14 game-card-${key}">
      <a href="/game?game=${key}">
        <div class="game-card-v14-img"><span>${esc(name)}</span></div>
        <div class="game-card-v14-body">
          <h2>${esc(name)}</h2>
          <p>${esc(desc)}</p>
          <span>SQL + animação</span>
          <b>Jogar</b>
        </div>
      </a>
    </article>`).join('');

  return shell({
    title: 'Jogos',
    subtitle: 'Mesas com regras, saldo e histórico.',
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
        <article class="game-stage-card game-stage-${game[0]}">
          <div class="game-table-safe">
            <h2>${esc(game[1])}</h2>
            <p>${esc(game[2])}</p>
            <div class="game-demo-area" id="gameDemo">${gameDemo(game[0])}</div>
            ${gameControls(game[0])}
            <div class="game-result" id="gameResult">Saldo atual: ${money(state.balance)}</div>
          </div>
        </article>

        <aside class="game-side">
          <section class="panel">
            <h2>Regras</h2>
            <p>${esc(game[2])}</p>
          </section>
          <section class="panel">
            <h2>Banco IRIS</h2>
            <p>Disponível: <b>${money(state.balance)}</b></p>
            <p>Jackpot: <b>${money(state.jackpot)}</b></p>
            <a class="primary side-link" href="/bank">Abrir banco</a>
          </section>
          <section class="panel">
            <h2>Histórico</h2>
            <div class="mini-history">${transactionsHtml(5)}</div>
          </section>
        </aside>
      </section>`
  });
}

function gameControls(game) {
  if (game === 'blackjack') {
    return `
      <div class="game-control-grid blackjack-actions">
        <label>Aposta <input id="betAmount" value="150" inputmode="decimal"></label>
        <button class="primary" data-blackjack-start>Nova rodada</button>
        <button class="primary" data-blackjack-hit>Pedir carta</button>
        <button class="primary" data-blackjack-stand>Parar</button>
      </div>`;
  }

  if (game === 'bingo') {
    return `
      <div class="game-control-grid">
        <label>Aposta <input id="betAmount" value="150" inputmode="decimal"></label>
        <label>Números <input id="gameChoice" value="7,14,21,32,45,58,70,88,93,100"></label>
        <button class="primary" data-bingo-start>Sortear número por número</button>
      </div>`;
  }

  if (game === 'crash') {
    return `
      <div class="game-control-grid">
        <label>Aposta <input id="betAmount" value="150" inputmode="decimal"></label>
        <label>Cashout alvo <input id="gameChoice" value="2.00"></label>
        <button class="primary" data-crash-start>Iniciar crash</button>
        <button class="primary" data-crash-cashout>Retirar</button>
      </div>`;
  }

  return `
    <div class="game-control-grid">
      <label>Aposta <input id="betAmount" value="150" inputmode="decimal"></label>
      ${choiceInput(game)}
      <button class="primary" data-play-game="${esc(game)}">Jogar agora</button>
    </div>`;
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
  return `<label>Modo
    <select id="gameChoice"><option value="default">Padrão</option><option value="risk">Risco alto</option></select>
  </label>`;
}

function gameDemo(key, data = null) {
  if (key === 'slots') {
    const symbols = data?.symbols || ['CRYSTAL','SEVEN','CROWN','CARD','VAULT','CHIP','CRYSTAL','SEVEN','CROWN'];
    return `<div class="slots-grid spinning">${symbols.map(s => `<span>${esc(s)}</span>`).join('')}</div>`;
  }
  if (key === 'blackjack') {
    const player = data?.player || ['?', '?'];
    const dealer = data?.dealer || ['?', '?'];
    return `<div class="cards-zone"><h3>Jogador</h3><div class="cards-row">${player.map(c => `<span>${esc(c)}</span>`).join('')}</div><h3>Banca</h3><div class="cards-row">${dealer.map(c => `<span>${esc(c)}</span>`).join('')}</div></div>`;
  }
  if (key === 'roulette') return `<div class="roulette-demo spin-wheel"><b>${data?.number ?? 0}</b></div>`;
  if (key === 'dice') {
    const dice = data?.dice || [4, 3];
    return `<div class="dice-demo rolling"><span>${dice[0]}</span><span>${dice[1]}</span></div>`;
  }
  if (key === 'bingo') {
    const nums = data?.drawn || Array.from({ length: 25 }, (_, i) => i + 1);
    return `<div class="bingo-demo">${nums.slice(0, 25).map(n => `<span class="${data?.picked?.includes(n) ? 'hit' : ''}">${n}</span>`).join('')}</div>`;
  }
  if (key === 'crash') return `<div class="crash-demo"><canvas id="crashCanvas" width="360" height="180"></canvas><b>${data?.multiplier || '1.00'}x</b><small>Crash</small></div>`;
  if (key === 'poker') {
    const cards = data?.cards || ['A','A','K','Q','J'];
    return `<div class="cards-row">${cards.map(c => `<span>${esc(c)}</span>`).join('')}</div>`;
  }
  return `<div class="generic-demo"><b>${esc(key.toUpperCase())}</b></div>`;
}

function bankPage(action) {
  const title = action === 'transfer' ? 'Transferência' : action === 'deposit' ? 'Depósito' : action === 'withdraw' ? 'Saque' : 'Banco IRIS';

  return shell({
    title,
    subtitle: state.sqlConnected ? 'Carteira sincronizada no Supabase SQL.' : 'Carteira local/fallback ativa.',
    active: action === 'overview' ? 'bank' : action,
    body: `
      <section class="bank-layout">
        <article class="bank-card bank-hero-card">
          <h2>Banco IRIS</h2>
          <p>Membro: <b>${esc(state.member.nick)}</b> • IRIS: <b>${esc(state.member.iris)}</b></p>
          <b class="balance-demo">${money(state.balance)}</b>
          <small>Bloqueado em saque: ${money(state.locked)} • ${state.sqlConnected ? 'SQL conectado' : 'Modo local'}</small>
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
          <div class="tx-list">${transactionsHtml(30)}</div>
        </article>
      </section>`
  });
}

function shopPage() {
  return shell({
    title: 'Loja',
    subtitle: 'Itens visuais com compra por saldo interno.',
    active: 'shop',
    body: `<section class="admin-grid">${shopItems.map(([key, name, price, desc]) => `
      <article class="category-card shop-item">
        <img src="/assets/v14/items/${key}.png" alt="${esc(name)}">
        <h2>${esc(name)}</h2>
        <p>${esc(desc)}</p>
        <b>${money(price)}</b>
        <button class="primary" data-buy-item="${esc(key)}">Comprar</button>
      </article>`).join('')}</section>`
  });
}

function missionsPage() {
  return shell({
    title: 'Missões',
    subtitle: 'Recompensas controladas e registradas.',
    active: 'missions',
    body: `<section class="admin-grid">${missions.map(([key, title, reward, desc]) => `
      <article class="category-card">
        <h2>${esc(title)}</h2>
        <p>${esc(desc)}</p>
        <button class="primary" data-mission="${esc(key)}">${state.missions[key] ? 'Coletada' : `Coletar ${money(reward)}`}</button>
      </article>`).join('')}</section>`
  });
}

function eventsPage() {
  return shell({
    title: 'Eventos',
    subtitle: 'Eventos com entrada e transação.',
    active: 'events',
    body: `<section class="admin-grid">${events.map(([key, title, fee, desc]) => `
      <article class="category-card">
        <h2>${esc(title)}</h2>
        <p>${esc(desc)}</p>
        <button class="primary" data-event="${esc(key)}">Entrar por ${money(fee)}</button>
      </article>`).join('')}</section>`
  });
}

function rankingsPage() {
  return shell({
    title: 'Rankings',
    subtitle: 'Ranking por saldo, pontos e vitórias.',
    active: 'rankings',
    body: `<section class="admin-grid">${state.ranking.map((row, idx) => `
      <article class="category-card">
        <h2>#${idx + 1} ${esc(row[0] || row.nick)}</h2>
        <p>Pontos: ${number(row[1] || row.score || 0)}</p>
      </article>`).join('')}</section>`
  });
}

function profilePage() {
  return shell({
    title: 'Perfil',
    subtitle: 'Dados do membro, inventário e estatísticas.',
    active: 'profile',
    body: `
      <section class="bank-layout">
        <article class="bank-card">
          <h2>${esc(state.member.nick)}</h2>
          <p>IRIS: ${esc(state.member.iris)}</p>
          <p>ID amigo: ${esc(state.member.friendCode)}</p>
          <p>VIP: ${number(state.vipPoints)} pontos</p>
          <label>Telefone <input id="phoneInput" value="${esc(state.member.phone || '')}" placeholder="xx xxxxx-xxxx"></label>
          <button class="primary" data-save-phone>Salvar telefone</button>
        </article>
        <article class="bank-card">
          <h2>Inventário</h2>
          <div class="tx-list">${state.inventory.map(i => `<div class="tx-row"><b>${esc(i)}</b><small>Item ativo</small></div>`).join('')}</div>
        </article>
      </section>`
  });
}

function adminPage() {
  const cards = [
    ['Status SQL', state.sqlConnected ? 'Conectado' : 'Modo local/fallback'],
    ['Saldo Banco IRIS', money(state.balance)],
    ['Bloqueado', money(state.locked)],
    ['Transações', state.transactions.length],
    ['Inventário', state.inventory.length],
    ['Mensagem', state.sqlMessage]
  ];

  return shell({
    title: 'Módulo de Comando',
    subtitle: 'Painel admin, logs, gráficos e manutenção.',
    active: 'admin',
    body: `
      <section class="admin-grid">
        ${cards.map(([a,b]) => `<article class="category-card"><h2>${esc(a)}</h2><p>${esc(b)}</p></article>`).join('')}
        <article class="category-card admin-actions">
          <h2>Ações de sistema</h2>
          <button class="primary" data-admin-action="sync">Sincronizar SQL</button>
          <button class="primary" data-admin-action="bonus">Aplicar bônus</button>
          <button class="primary" data-admin-action="backup">Gerar backup local</button>
          <button class="primary" data-admin-action="reset">Resetar local</button>
        </article>
        <article class="category-card chart-card"><h2>Transações por segundo</h2><canvas id="txChart" width="400" height="180"></canvas></article>
        <article class="category-card chart-card"><h2>Jogos ativos</h2><canvas id="gameChart" width="400" height="180"></canvas></article>
        <article class="category-card bank-history-card">
          <h2>Logs recentes</h2>
          <div class="tx-list">${state.audit.slice(0, 12).map(log => `<div class="tx-row"><b>${esc(log.type)}</b><small>${esc(log.message)} • ${esc(log.time)}</small></div>`).join('') || '<p>Sem logs.</p>'}</div>
        </article>
      </section>`
  });
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
  document.querySelector('[data-toggle-menu]')?.addEventListener('click', () => document.body.classList.toggle('menu-open'));

  document.querySelector('[data-music-toggle]')?.addEventListener('click', () => {
    toast('Player preparado. Adicione um arquivo em public/assets/v14/audio para ativar música.', 'warn');
  });

  document.querySelector('[data-save-phone]')?.addEventListener('click', async () => {
    const phone = document.querySelector('#phoneInput')?.value?.trim() || '';
    if (phone && !/^\d{2}\s\d{4,5}-\d{4}$/.test(phone)) return toast('Telefone inválido. Use xx xxxxx-xxxx.', 'bad');

    if (state.sqlConnected) {
      const remote = await IrisSQL.savePhone(phone);
      if (remote?.ok) return applyRemoteAndRoute(remote, remote.message || 'Telefone salvo no SQL.');
      toast(remote?.error || 'Falha SQL. Salvando local.', 'bad');
    }

    state.member.phone = phone;
    audit('profile', 'Telefone atualizado localmente.');
    saveLocal(state);
    toast('Telefone salvo.', 'good');
  });
}

function bindBankActions() {
  document.querySelector('[data-bank-action="deposit"]')?.addEventListener('click', async () => {
    const amount = parseAmount(document.querySelector('#depositAmount')?.value);
    const ref = document.querySelector('#depositReference')?.value || '';
    if (amount <= 0) return toast('Valor inválido.', 'bad');

    if (state.sqlConnected) {
      const remote = await IrisSQL.deposit(amount, ref);
      if (remote?.ok) return applyRemoteAndRoute(remote, remote.message || 'Depósito registrado no SQL.');
      toast(remote?.error || 'Falha SQL. Registrando local.', 'bad');
    }

    state.balance += amount;
    tx('deposit', amount, `Depósito local: ${ref}`, 'approved');
    audit('deposit', `Depósito local ${money(amount)}`);
    saveLocal(state);
    toast('Depósito registrado.', 'good');
    route();
  });

  document.querySelector('[data-bank-action="withdraw"]')?.addEventListener('click', async () => {
    const amount = parseAmount(document.querySelector('#withdrawAmount')?.value);
    const dest = document.querySelector('#withdrawDestination')?.value || '';
    if (amount <= 0) return toast('Valor inválido.', 'bad');

    if (state.sqlConnected) {
      const remote = await IrisSQL.withdraw(amount, dest);
      if (remote?.ok) return applyRemoteAndRoute(remote, remote.message || 'Saque solicitado no SQL.');
      toast(remote?.error || 'Falha SQL. Tentando local.', 'bad');
    }

    if (amount > state.balance) return toast('Saldo insuficiente.', 'bad');
    state.balance -= amount;
    state.locked += amount;
    tx('withdraw', amount, `Saque local: ${dest}`, 'pending');
    audit('withdraw', `Saque local ${money(amount)}`);
    saveLocal(state);
    toast('Saque solicitado.', 'good');
    route();
  });

  document.querySelector('[data-bank-action="transfer"]')?.addEventListener('click', async () => {
    const amount = parseAmount(document.querySelector('#transferAmount')?.value);
    const to = document.querySelector('#transferTo')?.value?.trim() || '';
    if (!to) return toast('Destino obrigatório.', 'bad');
    if (amount <= 0) return toast('Valor inválido.', 'bad');

    if (state.sqlConnected) {
      const remote = await IrisSQL.transfer(to, amount);
      if (remote?.ok) return applyRemoteAndRoute(remote, remote.message || 'Transferência registrada no SQL.');
      toast(remote?.error || 'Falha SQL. Tentando local.', 'bad');
    }

    if (amount > state.balance) return toast('Saldo insuficiente.', 'bad');
    state.balance -= amount;
    tx('transfer', -amount, `Transferência local para ${to}`, 'completed');
    audit('transfer', `Transferência local para ${to}`);
    saveLocal(state);
    toast('Transferência enviada.', 'good');
    route();
  });
}

function bindGameActions() {
  document.querySelector('[data-play-game]')?.addEventListener('click', async event => {
    const game = event.currentTarget.dataset.playGame;
    const bet = parseAmount(document.querySelector('#betAmount')?.value);
    const choice = document.querySelector('#gameChoice')?.value || 'default';
    if (bet <= 0) return toast('Aposta inválida.', 'bad');
    if (bet > state.balance) return toast('Saldo insuficiente.', 'bad');

    let result;
    if (game === 'roulette') result = playRoulette(bet, choice);
    else if (game === 'dice') result = playDice(bet, choice);
    else if (game === 'slots') result = playSlots(bet);
    else if (game === 'memory') result = playMemory(bet);
    else if (game === 'poker') result = playPoker(bet);
    else result = playPoker(bet);

    await settleGame(game, bet, choice, result);
  });

  document.querySelector('[data-blackjack-start]')?.addEventListener('click', () => {
    const bet = parseAmount(document.querySelector('#betAmount')?.value);
    if (bet <= 0) return toast('Aposta inválida.', 'bad');
    if (bet > state.balance) return toast('Saldo insuficiente.', 'bad');

    currentBlackjack = { bet, player: [drawCard(), drawCard()], dealer: [drawCard(), drawCard()] };
    updateBlackjackDisplay('Rodada iniciada. Peça carta ou pare.');
  });

  document.querySelector('[data-blackjack-hit]')?.addEventListener('click', () => {
    if (!currentBlackjack) return toast('Inicie uma rodada.', 'bad');
    currentBlackjack.player.push(drawCard());
    const total = handValue(currentBlackjack.player);
    if (total > 21) {
      const result = finishBlackjack(currentBlackjack.player, currentBlackjack.dealer, currentBlackjack.bet);
      settleGame('blackjack', currentBlackjack.bet, 'hit', result);
      currentBlackjack = null;
    } else {
      updateBlackjackDisplay(`Você tem ${total}. Pode pedir carta ou parar.`);
    }
  });

  document.querySelector('[data-blackjack-stand]')?.addEventListener('click', () => {
    if (!currentBlackjack) return toast('Inicie uma rodada.', 'bad');
    const result = finishBlackjack(currentBlackjack.player, currentBlackjack.dealer, currentBlackjack.bet);
    settleGame('blackjack', currentBlackjack.bet, 'stand', result);
    currentBlackjack = null;
  });

  document.querySelector('[data-bingo-start]')?.addEventListener('click', () => {
    const bet = parseAmount(document.querySelector('#betAmount')?.value);
    const picked = String(document.querySelector('#gameChoice')?.value || '').split(',').map(v => Number(v.trim())).filter(Boolean).slice(0, 10);
    if (bet <= 0) return toast('Aposta inválida.', 'bad');
    if (bet > state.balance) return toast('Saldo insuficiente.', 'bad');

    const drawn = drawBingoNumbers(25);
    currentBingo = { bet, picked, drawn, step: 0 };
    animateBingoDraw();
  });

  document.querySelector('[data-crash-start]')?.addEventListener('click', () => {
    const bet = parseAmount(document.querySelector('#betAmount')?.value);
    const target = Number(String(document.querySelector('#gameChoice')?.value || '2').replace(',', '.'));
    if (bet <= 0) return toast('Aposta inválida.', 'bad');
    if (bet > state.balance) return toast('Saldo insuficiente.', 'bad');
    startCrashRound(bet, target);
  });

  document.querySelector('[data-crash-cashout]')?.addEventListener('click', () => {
    toast('Cashout usa o alvo configurado no campo.', 'warn');
  });
}

function bindShopActions() {
  document.querySelectorAll('[data-buy-item]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const itemKey = btn.dataset.buyItem;
      const item = shopItems.find(i => i[0] === itemKey);
      if (!item) return toast('Item não encontrado.', 'bad');
      const [key, name, price] = item;

      if (state.sqlConnected) {
        const remote = await IrisSQL.buyItem(key);
        if (remote?.ok) return applyRemoteAndRoute(remote, remote.message || 'Item comprado no SQL.');
        toast(remote?.error || 'Falha SQL. Comprando local.', 'bad');
      }

      if (price > state.balance) return toast('Saldo insuficiente.', 'bad');
      state.balance -= price;
      state.inventory.unshift(name);
      tx('shop', -price, `Compra local: ${name}`, 'completed');
      audit('shop', `Item comprado: ${name}`);
      saveLocal(state);
      toast(`Item comprado: ${name}`, 'good');
      route();
    });
  });

  document.querySelectorAll('[data-mission]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.mission;
      const mission = missions.find(m => m[0] === key);
      if (!mission || state.missions[key]) return toast('Missão indisponível ou já coletada.', 'bad');

      if (state.sqlConnected) {
        const remote = await IrisSQL.collectMission(key);
        if (remote?.ok) return applyRemoteAndRoute(remote, remote.message || 'Missão coletada no SQL.');
        toast(remote?.error || 'Falha SQL. Coletando local.', 'bad');
      }

      state.missions[key] = true;
      state.balance += mission[2];
      state.vipPoints += Math.max(1, Math.round(mission[2] / 10));
      tx('mission', mission[2], `Missão local: ${mission[1]}`, 'completed');
      audit('mission', `Missão coletada: ${mission[1]}`);
      saveLocal(state);
      toast('Missão coletada.', 'good');
      route();
    });
  });

  document.querySelectorAll('[data-event]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.event;
      const event = events.find(e => e[0] === key);
      if (!event) return toast('Evento não encontrado.', 'bad');

      if (state.sqlConnected) {
        const remote = await IrisSQL.enterEvent(key);
        if (remote?.ok) return applyRemoteAndRoute(remote, remote.message || 'Evento registrado no SQL.');
        toast(remote?.error || 'Falha SQL. Entrando local.', 'bad');
      }

      if (event[2] > state.balance) return toast('Saldo insuficiente.', 'bad');
      state.balance -= event[2];
      tx('event', -event[2], `Entrada local: ${event[1]}`, 'completed');
      audit('event', `Entrada em evento: ${event[1]}`);
      saveLocal(state);
      toast('Entrada confirmada.', 'good');
      route();
    });
  });
}

function bindAdminActions() {
  document.querySelector('[data-admin-action="sync"]')?.addEventListener('click', async () => {
    const remote = await syncSql();
    if (remote?.ok) toast('SQL sincronizado.', 'good');
  });

  document.querySelector('[data-admin-action="bonus"]')?.addEventListener('click', async () => {
    if (state.sqlConnected) {
      const remote = await IrisSQL.adminBonus(777);
      if (remote?.ok) return applyRemoteAndRoute(remote, remote.message || 'Bônus aplicado no SQL.');
      toast(remote?.error || 'Falha SQL. Aplicando local.', 'bad');
    }

    state.balance += 777;
    tx('admin_bonus', 777, 'Bônus admin local', 'completed');
    audit('admin', 'Bônus local aplicado.');
    saveLocal(state);
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
    toast('Backup local gerado.', 'good');
  });

  document.querySelector('[data-admin-action="reset"]')?.addEventListener('click', () => {
    if (!confirm('Resetar dados locais?')) return;
    state = resetLocal();
    toast('Dados locais resetados.', 'good');
    route();
  });
}

async function settleGame(game, bet, choice, result) {
  if (state.sqlConnected) {
    const remote = await IrisSQL.playGame(game, bet, choice, result);
    if (remote?.ok) {
      applyRemote(remote);
      const sqlResult = remote.gameResult || result;
      updateGameResult(game, sqlResult);
      saveLocal(state);
      return;
    }
    toast(remote?.error || 'Falha SQL. Rodando local.', 'bad');
  }

  state.balance -= bet;
  if (result.payout > 0) state.balance += result.payout;
  state.jackpot += Math.max(1, bet * 0.03);
  state.vipPoints += Math.max(1, Math.round(bet / 25));
  tx(result.win ? 'game_win' : 'game_loss', result.payout - bet, `${result.title}: ${result.message}`, 'completed', { game, result });
  audit('game', `${game}: ${result.message}`);
  if (result.win) updateRanking(state.member.nick, Math.round(result.payout));
  saveLocal(state);
  updateGameResult(game, result);
}

function updateGameResult(game, result) {
  const demo = document.querySelector('#gameDemo');
  const out = document.querySelector('#gameResult');
  if (demo) demo.innerHTML = gameDemo(game, result.visual || result);
  if (out) out.innerHTML = `<b>${result.win ? 'Vitória' : 'Derrota'}</b> — ${esc(result.message || 'Rodada concluída.')}<br>Saldo atual: ${money(state.balance)}`;
  toast(result.win ? `Vitória: ${money(result.payout || 0)}` : 'Rodada encerrada.', result.win ? 'good' : 'bad');
}

function updateBlackjackDisplay(message) {
  const demo = document.querySelector('#gameDemo');
  const out = document.querySelector('#gameResult');
  if (demo) demo.innerHTML = gameDemo('blackjack', currentBlackjack);
  if (out) out.innerHTML = esc(message);
}

function animateBingoDraw() {
  if (!currentBingo) return;
  const drawnNow = currentBingo.drawn.slice(0, currentBingo.step + 1);
  const demo = document.querySelector('#gameDemo');
  if (demo) demo.innerHTML = gameDemo('bingo', { picked: currentBingo.picked, drawn: drawnNow });
  currentBingo.step += 1;

  if (currentBingo.step < currentBingo.drawn.length) {
    setTimeout(animateBingoDraw, 190);
  } else {
    const result = scoreBingo(currentBingo.bet, currentBingo.picked, currentBingo.drawn);
    settleGame('bingo', currentBingo.bet, currentBingo.picked.join(','), result);
    currentBingo = null;
  }
}

function startCrashRound(bet, target) {
  const canvas = document.querySelector('#crashCanvas');
  const ctx = canvas?.getContext('2d');
  let mult = 1.0;
  const crashAt = +(1.05 + Math.random() * 7).toFixed(2);
  clearInterval(crashTimer);
  crashTimer = setInterval(() => {
    mult = +(mult + 0.05).toFixed(2);
    if (ctx) {
      ctx.clearRect(0,0,360,180);
      ctx.strokeStyle = '#d9b05f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(20,160);
      ctx.lineTo(20 + Math.min(320, mult * 70), Math.max(15, 160 - mult * 32));
      ctx.stroke();
    }
    const out = document.querySelector('#gameResult');
    if (out) out.innerHTML = `Multiplicador: <b>${mult.toFixed(2)}x</b> • Alvo ${target.toFixed(2)}x`;
    if (mult >= target || mult >= crashAt) {
      clearInterval(crashTimer);
      const result = {
        title: 'Crash',
        win: target < crashAt,
        payout: target < crashAt ? bet * target : 0,
        multiplier: target < crashAt ? target : 0,
        message: `Cashout ${target.toFixed(2)}x / Crash ${crashAt.toFixed(2)}x. ${target < crashAt ? 'Retirada a tempo.' : 'Caiu antes.'}`,
        visual: { multiplier: mult.toFixed(2), crash: crashAt }
      };
      settleGame('crash', bet, target, result);
    }
  }, 120);
}

async function syncSql() {
  const remote = await IrisSQL.boot(state.member.nick);
  if (remote?.ok) {
    applyRemote(remote);
    state.sqlConnected = true;
    state.sqlMessage = 'Sincronizado com Supabase SQL.';
    saveLocal(state);
    route();
  } else {
    toast(remote?.error || remote?.message || 'Falha ao sincronizar SQL.', 'bad');
  }
  return remote;
}

function applyRemoteAndRoute(remote, message) {
  applyRemote(remote);
  saveLocal(state);
  toast(message, 'good');
  route();
}

function applyRemote(remote) {
  if (!remote || !remote.ok) return;
  state.sqlConnected = true;
  state.sqlMessage = remote.message || 'Conectado ao Supabase SQL.';
  if (remote.member) {
    state.member = {
      ...state.member,
      nick: remote.member.nick || state.member.nick,
      iris: remote.member.iris || remote.member.irisId || state.member.iris,
      friendCode: remote.member.friendCode || state.member.friendCode,
      phone: remote.member.phone || '',
      role: remote.member.role || state.member.role
    };
  }
  if (typeof remote.balance === 'number') state.balance = remote.balance;
  if (typeof remote.locked === 'number') state.locked = remote.locked;
  if (typeof remote.vipPoints === 'number') state.vipPoints = remote.vipPoints;
  if (typeof remote.jackpot === 'number') state.jackpot = remote.jackpot;
  if (Array.isArray(remote.transactions)) state.transactions = remote.transactions.map(normalizeTx);
  if (Array.isArray(remote.inventory)) state.inventory = remote.inventory;
  if (Array.isArray(remote.ranking)) state.ranking = remote.ranking.map(row => [row.nick || row[0], Number(row.score ?? row[1] ?? 0)]);
  if (remote.missions && typeof remote.missions === 'object') state.missions = remote.missions;
}

function normalizeTx(item) {
  return {
    id: item.id || cryptoRandom(),
    type: item.type || 'tx',
    amount: Number(item.amount ?? item.amount_units ?? 0),
    description: item.description || '',
    status: item.status || 'completed',
    time: item.time || item.createdAt || item.created_at || now()
  };
}

function tx(type, amount, description, status = 'completed', metadata = {}) {
  state.transactions.unshift({ id: cryptoRandom(), type, amount, description, status, metadata, time: now() });
  state.transactions = state.transactions.slice(0, 80);
}

function audit(type, message) {
  state.audit.unshift({ type, message, time: now() });
  state.audit = state.audit.slice(0, 100);
}

function updateRanking(nick, score) {
  const found = state.ranking.find(row => row[0] === nick);
  if (found) found[1] += score;
  else state.ranking.push([nick, score]);
  state.ranking = state.ranking.sort((a,b) => b[1] - a[1]).slice(0, 10);
}

function transactionsHtml(limit = 10) {
  return state.transactions.slice(0, limit).map(item => `
    <div class="tx-row ${esc(item.type)}">
      <b>${esc(item.type)}</b>
      <span>${money(item.amount)}</span>
      <small>${esc(item.description)} • ${esc(item.status)} • ${esc(item.time)}</small>
    </div>`).join('') || '<p>Nenhuma transação.</p>';
}

function rankingList() {
  return state.ranking.slice(0, 5).map(row => `<li><b>${esc(row[0] || row.nick)}</b><span>${number(row[1] || row.score || 0)}</span></li>`).join('');
}

function startLiveAdminCharts() {
  const txCanvas = document.querySelector('#txChart');
  const gameCanvas = document.querySelector('#gameChart');
  drawMiniChart(txCanvas, [10,14,9,18,22,16,28]);
  drawMiniChart(gameCanvas, [4,8,7,12,6,15,10], '#7d38ff');
}

function drawMiniChart(canvas, values, color = '#d9b05f') {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let tick = 0;
  const draw = () => {
    tick++;
    const data = values.map(v => Math.max(2, v + Math.sin(tick/3) * 5 + Math.random() * 3));
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = 20 + i * ((canvas.width - 40) / (data.length - 1));
      const y = canvas.height - 18 - v * 4;
      if (i === 0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    });
    ctx.stroke();
  };
  draw();
  setInterval(draw, 1000);
}

function showLoading() {
  if (document.querySelector('#blindersLoading')) return;
  const el = document.createElement('div');
  el.id = 'blindersLoading';
  el.className = 'blinders-loading';
  el.innerHTML = `
    <div class="loading-card">
      <b>BLINDERS</b>
      <span id="loadingMsg">Inicializando...</span>
      <div class="loading-bar"><i id="loadingProgress"></i></div>
    </div>`;
  document.body.appendChild(el);
}

function updateLoading(percent, msg) {
  const bar = document.querySelector('#loadingProgress');
  const text = document.querySelector('#loadingMsg');
  if (bar) bar.style.width = `${percent}%`;
  if (text) text.textContent = msg;
}

function hideLoading() {
  const el = document.querySelector('#blindersLoading');
  if (!el) return;
  el.classList.add('hide');
  setTimeout(() => el.remove(), 260);
}

function errorPage(error) {
  return `<main class="v14-error-page"><section class="v14-error-card"><h1>Erro no Blinders</h1><p>${esc(error.message || error)}</p><button onclick="location.reload()">Recarregar</button><a href="/menu">Voltar</a></section></main>`;
}

function cryptoRandom() {
  try { return crypto.randomUUID(); }
  catch { return 'id-' + Math.random().toString(16).slice(2); }
}

function structuredCloneSafe(value) {
  try { return structuredClone(value); }
  catch { return JSON.parse(JSON.stringify(value)); }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

window.addEventListener('popstate', route);
