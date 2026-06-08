import { Chart, registerables } from 'chart.js';
import { IrisSQL } from '../api/irisSql.js';
import { esc, oldMoney, parseMoney } from '../ui/format.js';
import { toast, musicPopup } from '../ui/toast.js';
import { games, roulette, dice, slots, drawCard, handValue, blackjackFinish, bingo, memory, crash, poker } from '../games/rules.js';
import { shopItems, territories, travelItems } from '../systems/catalog.js';
import { mountGameCanvas } from './Renderer.js';

Chart.register(...registerables);

const state = {
  sqlConnected: false,
  sqlMessage: 'Banco IRIS indisponível',
  member: { nick: 'KageShinobi', iris: 'IRIS-KAGE-777', friendCode: 'KS-777', role: 'admin', level: 87 },
  balance: 25430.75,
  locked: 0,
  vipPoints: 12870,
  ranking: [['Shinigami_7',245780],['KageShinobi',189430],['AzulNeon',153920],['ShadowBR',99875],['IrisQueen',87610]],
  transactions: [],
  gameStatus: Object.fromEntries(games.map(g => [g[0], { maintenance:false, live:true, duel:true }])),
  radio: { title: '', youtubeUrl: '' },
  location: 'vila_neon'
};

const adminModules = [
  ['dashboard','Dashboard','Visão geral, gráficos e alertas do sistema.'],
  ['users','Usuários','Membros, cargos, status, telefone, nível e permissões.'],
  ['deposits','Depósitos','Aprovar, registrar, consultar e auditar depósitos.'],
  ['withdraws','Saques','Solicitações, destino, aprovação e bloqueio.'],
  ['transfers','Transferências','Movimento entre membros e rastreio de valores.'],
  ['games','Jogos','Regras, apostas, limites, salas ao vivo e 1x1.'],
  ['maintenance','Manutenção','Travar cada jogo separadamente sem derrubar o site.'],
  ['radio','Rádio global','Música do YouTube, popup e anúncio no topo.'],
  ['shop','Loja e preços','Alterar valor de itens, raridade e disponibilidade.'],
  ['items','Itens','Inventário, locomoção, VIP, frames e consumíveis.'],
  ['events','Eventos','Torneios, bônus, agenda e eventos do mapa.'],
  ['bonus','Bônus','Bônus manuais, diários, VIP e campanhas.'],
  ['missions','Missões','Missões diárias, semanais e recompensas.'],
  ['vip','VIP','Leveis, status, pontos e recompensas.'],
  ['families','Famílias','Famílias, membros, ranking e poder.'],
  ['mafias','Máfias','Máfias, contratos, ataques e reputação.'],
  ['map','Mapa','Cidades, distâncias, rotas e territórios.'],
  ['attacks','Ataques','Ataques, defesa, cooldown e logs de combate.'],
  ['travels','Viagens','Tempo de viagem, itens rápidos e chegada.'],
  ['marriages','Casamentos','Pedidos, status e benefícios sociais.'],
  ['territories','Territórios','Conquista, defesa e domínio.'],
  ['announcements','Anúncios','Ticker global e popup temporário.'],
  ['ranking','Ranking','Ranking semanal, geral, vitórias e VIP.'],
  ['logs','Logs','Auditoria, transações, ações admin e erros.'],
  ['security','Segurança','Sessões, bloqueios, permissões e validações.'],
  ['appearance','Aparência','Tema, banners, carrossel, PNGs e layout.'],
  ['backup','Backup','Exportação, restauração e checklist de lançamento.'],
  ['system','Sistema','Status SQL, cache, deploy e diagnóstico.']
];

let blackjackState = null;
let charts = [];

export async function boot() {
  showLoading();
  updateLoading(24, 'Carregando visual de lançamento');
  const remote = await IrisSQL.boot();
  if (remote?.ok) {
    applyRemote(remote);
    state.sqlConnected = true;
    state.sqlMessage = 'Banco IRIS online';
  } else if (remote?.needsLogin) {
    state.sqlConnected = false;
    state.sqlMessage = 'Aguardando login';
  } else {
    state.sqlConnected = false;
    state.sqlMessage = remote?.error || 'Banco IRIS indisponível';
  }
  updateLoading(72, 'Preparando painéis e vitrine');
  await wait(120);
  updateLoading(100, 'Finalizando');
  await wait(120);
  hideLoading();
  setInterval(pollRadio, 30000);
  pollRadio();
}

export function route() {
  const app = document.querySelector('#app');
  if (!app) throw new Error('Elemento #app não encontrado.');
  const path = location.pathname || '/';
  const q = new URLSearchParams(location.search);

  if (path === '/login') return render(app, loginPage('login'));
  if (path === '/register') return render(app, loginPage('register'));
  if (path === '/repair') return render(app, loginPage('repair'));
  if (!IrisSQL.hasSession()) return render(app, loginPage('login'));
  if (path === '/' || path === '/home') return render(app, homeExact());
  if (path === '/games') return render(app, gamesPage());
  if (path === '/game') return render(app, gamePage(q.get('game') || 'roulette'));
  if (path === '/bank') return render(app, bankPage());
  if (path === '/shop') return render(app, shopPage());
  if (path === '/levels') return render(app, levelsPage());
  if (path === '/families') return render(app, familyPage('family'));
  if (path === '/mafias') return render(app, familyPage('mafia'));
  if (path === '/map') return render(app, mapPage());
  if (path === '/attacks') return render(app, attacksPage());
  if (path === '/travels') return render(app, travelsPage());
  if (path === '/marriage') return render(app, marriagePage());
  if (path === '/territory') return render(app, territoryPage());
  if (path === '/admin') return render(app, adminPage(q.get('module') || 'dashboard'));

  return render(app, shell('Página não encontrada', '<section class="panel v3-panel">Rota não encontrada.</section>', 'home'));
}

function render(app, html) {
  destroyCharts();
  app.innerHTML = html;
  bindLinks();
  bindActions();
  const canvas = document.querySelector('#pixiStage');
  if (canvas) mountGameCanvas(canvas, canvas.dataset.game || 'default');
  initCarousel();
  initCharts();
}

function homeExact() {
  return `
  <main class="v3-exact-page">
    <section class="v3-exact-stage">
      <img class="v3-exact-bg" src="/assets/v15/reference/home-dashboard-exact.png" alt="Blinders Cassino lançamento">
      <div class="v3-system-badge ${state.sqlConnected ? 'online' : 'offline'}">${esc(state.sqlMessage)}</div><button class="v4-install-floating" data-install-app>Instalar app</button><button class="v4-logout-floating" data-logout>Sair</button>

      <a class="v3-hotspot hs-home" href="/home" aria-label="Home"></a>
      <a class="v3-hotspot hs-games" href="/games" aria-label="Jogos"></a>
      <a class="v3-hotspot hs-bank" href="/bank" aria-label="Banco IRIS"></a>
      <a class="v3-hotspot hs-transfer" href="/bank?action=transfer" aria-label="Transferência"></a>
      <a class="v3-hotspot hs-deposit" href="/bank?action=deposit" aria-label="Depósito"></a>
      <a class="v3-hotspot hs-withdraw" href="/bank?action=withdraw" aria-label="Saque"></a>
      <a class="v3-hotspot hs-shop" href="/shop" aria-label="Loja"></a>
      <a class="v3-hotspot hs-admin" href="/admin" aria-label="Admin"></a>

      <a class="v3-hotspot hs-hero-play" href="/games" aria-label="Jogar agora"></a>
      <a class="v3-hotspot hs-bank-deposit" href="/bank?action=deposit"></a>
      <a class="v3-hotspot hs-bank-withdraw" href="/bank?action=withdraw"></a>
      <a class="v3-hotspot hs-bank-transfer" href="/bank?action=transfer"></a>
      <a class="v3-hotspot hs-shop-go" href="/shop"></a>

      <button class="v3-car-arrow left" data-car-left aria-label="Voltar vitrine">‹</button>
      <div class="v3-card-carousel" data-carousel>
        <div class="v3-card-track" data-carousel-track>
          ${games.map(g => `<a class="v3-card-item" href="/game?game=${g[0]}"><img src="/assets/v15/cards/${g[0]}.png" alt="${esc(g[1])}"></a>`).join('')}
        </div>
      </div>
      <button class="v3-car-arrow right" data-car-right aria-label="Avançar vitrine">›</button>

      <div class="v3-live-overlay">
        <canvas id="homeActivityChart"></canvas>
      </div>
    </section>
  </main>`;
}


function loginPage(mode='login') {
  const isRegister = mode === 'register';
  const isRepair = mode === 'repair';
  const title = isRegister ? 'Criar conta' : isRepair ? 'Reparar senha' : 'Entrar';
  return `
  <main class="v4-auth-page">
    <section class="v4-auth-bg"><img src="/assets/v15/reference/home-dashboard-exact.png" alt=""></section>
    <section class="v4-auth-card">
      <div class="v4-auth-logo"><img src="/assets/v14/icons/home.png"><b>BLINDERS</b><span>CASINO</span></div>
      <div class="v4-auth-info"><div class="v4-auth-info-track">
        <article><b>Visual de lançamento</b><span>Interface anime/cyber espelhada na home oficial.</span></article>
        <article><b>Banco IRIS</b><span>Saldo, depósito, saque e transferência conectados ao SQL.</span></article>
        <article><b>Jogos e territórios</b><span>Mesas, carrossel, mapa, famílias, máfias e eventos.</span></article>
      </div></div>
      <h1>${title}</h1>
      <p>${isRegister ? 'Cadastre com nick, conta IRIS/Zarcovi, telefone e senha do app.' : isRepair ? 'Use seu nick/IRIS e telefone cadastrado para definir nova senha.' : 'Entre para acessar o lançamento.'}</p>
      <form class="v4-auth-form" data-auth-form="${mode}">
        ${isRegister ? `<label>Nick<input id="authNick" required placeholder="Seu nick"></label><label>Conta IRIS/Zarcovi<input id="authIris" required placeholder="IRIS-KAGE-777"></label><label>Telefone<input id="authPhone" required placeholder="xx xxxxx-xxxx" maxlength="13"></label><label>Senha do app<input id="authPassword" type="password" required placeholder="Senha somente do app"></label><button type="submit">Criar conta</button>` : isRepair ? `<label>Nick ou IRIS<input id="authLogin" required placeholder="KageShinobi ou IRIS-KAGE-777"></label><label>Telefone cadastrado<input id="authPhone" required placeholder="xx xxxxx-xxxx" maxlength="13"></label><label>Nova senha<input id="authPassword" type="password" required placeholder="Nova senha do app"></label><button type="submit">Reparar senha</button>` : `<label>Nick ou IRIS<input id="authLogin" required value="KageShinobi"></label><label>Senha<input id="authPassword" type="password" required placeholder="Senha do app"></label><button type="submit">Entrar</button>`}
      </form>
      <nav class="v4-auth-links"><a href="/login">Entrar</a><a href="/register">Criar conta</a><a href="/repair">Reparar senha</a></nav>
      <button class="v4-install-auth" data-install-app>Instalar app</button>
      <small class="v4-auth-note">Não use a senha real da sua conta Zarcovi. Use uma senha própria para este app.</small>
    </section>
  </main>`;
}

function shell(title, body, active='home') {
  return `
  <main class="release-shell v3-shell">
    <aside class="side v3-side">
      <a class="brand v3-brand" href="/home"><img src="/assets/v14/icons/home.png"><b>BLINDERS</b><small>CASINO</small></a>
      <nav class="menu-icons v3-menu">
        ${nav('/home','Home','home',active)}
        ${nav('/games','Jogos','games',active)}
        ${nav('/bank','Banco IRIS','bank',active)}
        ${nav('/bank?action=transfer','Transferência','transfer',active)}
        ${nav('/bank?action=deposit','Depósito','deposit',active)}
        ${nav('/bank?action=withdraw','Saque','withdraw',active)}
        ${nav('/levels','Leveis','levels',active)}
        ${nav('/families','Famílias','families',active)}
        ${nav('/mafias','Máfias','mafias',active)}
        ${nav('/map','Mapa','map',active)}
        ${nav('/attacks','Ataques','attacks',active)}
        ${nav('/travels','Viagens','travels',active)}
        ${nav('/marriage','Casamentos','marriage',active)}
        ${nav('/territory','Território','territory',active)}
        ${nav('/shop','Loja','shop',active)}
        ${nav('/admin','Admin','admin',active)}
      </nav>
      <section class="vip-panel v3-vip"><img src="/assets/v14/items/coroa_vip.png"><b>DIAMANTE</b><span>${state.vipPoints.toLocaleString('pt-BR')} pts</span></section>
    </aside>
    <section class="main v3-main">
      <div class="top-ticker v3-ticker"><b>ANÚNCIO GLOBAL</b><span>Torneio Blackjack ao vivo • Rádio Blinders • Jogos 1x1 • Mapa e territórios ativos • Jackpot ${oldMoney(1458769.36)}</span></div>
      <header class="topbar v3-topbar">
        <button data-menu>Menu</button>
        <div>${esc(state.member.nick)} • Nível ${state.member.level || 1} • Saldo ${oldMoney(state.balance)}</div>
        <nav><button data-install-app>Instalar</button><button data-radio-toggle>Rádio</button><button data-logout>Sair</button><a href="/admin">Admin</a></nav>
      </header>
      <section class="hero v3-hero"><h1>${esc(title)}</h1><p>${state.sqlConnected ? 'Banco IRIS online' : 'Banco IRIS indisponível'}</p></section>
      ${body}
      <footer class="bottom-status v3-bottom"><span>Online agora 2.456</span><span>Jogadores hoje 12.364</span><span>Jackpot ${oldMoney(125347.89)}</span><span>Torneios ativos 3</span></footer>
    </section>
  </main>
  <div id="toastStack" class="toast-stack"></div>`;
}

function nav(h,label,icon,active) {
  const is = h.includes(active) || (active === 'home' && h === '/home');
  return `<a class="${is?'active':''}" href="${h}"><img src="/assets/v14/icons/${icon}.png"><span>${esc(label)}</span></a>`;
}

function gameTile(k,n) {
  const st = state.gameStatus[k] || {};
  return `<a class="v3-game-card ${st.maintenance?'locked':''}" href="/game?game=${k}">
    <img src="/assets/v15/cards/${k}.png" alt="${esc(n)}">
    <span>${st.maintenance?'Manutenção':'Jogar'}</span>
  </a>`;
}

function gamesPage() {
  return shell('Jogos', `
    <section class="v3-section-title"><b>Vitrine de jogos</b><span>Carrossel premium com salas ao vivo e 1x1</span></section>
    <section class="v3-game-grid">${games.map(g=>gameTile(g[0],g[1])).join('')}</section>
  `, 'games');
}

function gamePage(key) {
  const g = games.find(x=>x[0]===key) || games[0];
  const locked = state.gameStatus[key]?.maintenance;
  return shell(g[1], `
  <section class="game-screen v3-game-screen game-${key}">
    <article class="game-table v3-game-table" style="background-image:linear-gradient(180deg,rgba(0,0,0,.10),rgba(0,0,0,.78)),url('/assets/v14/tables/${key}-table.png')">
      <div id="pixiStage" data-game="${key}" class="pixi-stage"></div>
      <div id="gameVisual" class="game-visual">${gameVisual(key)}</div>
      <div class="game-controls v3-game-controls">
        <input id="bet" value="10b" ${locked?'disabled':''}>
        ${choice(key)}
        ${key==='blackjack' ? `<button data-bj-start ${locked?'disabled':''}>Nova rodada</button><button data-bj-hit ${locked?'disabled':''}>Pedir carta</button><button data-bj-stop ${locked?'disabled':''}>Parar</button>` : `<button data-play="${key}" ${locked?'disabled':''}>Jogar</button>`}
      </div>
      <p id="gameResult">${locked ? 'Este jogo está em manutenção.' : 'Pronto para jogar.'}</p>
    </article>
  </section>`, 'games');
}

function gameVisual(key) {
  if (key === 'blackjack') return `<div class="cards"><span>?</span><span>?</span></div><div class="cards"><span>?</span><span>?</span></div>`;
  if (key === 'slots') return `<div class="slots">${Array.from({length:9},(_,i)=>`<span>${['7','C','V','R','A'][i%5]}</span>`).join('')}</div>`;
  if (key === 'bingo') return `<div class="bingo">${Array.from({length:25},(_,i)=>`<span>${i+1}</span>`).join('')}</div>`;
  if (key === 'dice') return `<div class="dice"><span>4</span><span>3</span></div>`;
  if (key === 'crash') return `<div class="crash"><b>1.00x</b><canvas id="crashGraph" width="420" height="180"></canvas></div>`;
  return `<div class="roulette"><b>0</b></div>`;
}

function choice(key) {
  if (key==='roulette') return `<select id="choice"><option value="red">Vermelho</option><option value="black">Preto</option><option value="even">Par</option><option value="odd">Ímpar</option><option value="7">Número 7</option></select>`;
  if (key==='dice') return `<select id="choice"><option value="high">Alto</option><option value="low">Baixo</option><option value="even">Par</option><option value="odd">Ímpar</option><option value="7">Soma 7</option></select>`;
  if (key==='bingo') return `<input id="choice" value="7,14,21,32,45,58,70,88,93,100">`;
  if (key==='crash') return `<input id="choice" value="2">`;
  return `<input id="choice" value="default">`;
}

function bankPage() {
  return shell('Banco IRIS', `
  <section class="bank-grid v3-bank-grid">
    <article class="balance-panel v3-panel"><h2>Carteira</h2><b>${oldMoney(state.balance)}</b><span>Bloqueado ${oldMoney(state.locked)}</span></article>
    <article class="v3-panel"><h2>Depósito</h2><input id="depositAmount" value="100b"><input id="depositRef" value="comprovante"><button data-bank="deposit">Registrar</button></article>
    <article class="v3-panel"><h2>Saque</h2><input id="withdrawAmount" value="10b"><input id="withdrawDest" value="Conta Zarcovi"><button data-bank="withdraw">Solicitar</button></article>
    <article class="v3-panel"><h2>Transferência</h2><input id="transferTo" value="Shinigami_7"><input id="transferAmount" value="10b"><button data-bank="transfer">Enviar</button></article>
    <article class="history v3-panel"><h2>Histórico</h2>${state.transactions.slice(0,20).map(t=>`<p><b>${esc(t.type)}</b><span>${oldMoney(t.amount)}</span><small>${esc(t.description||'')}</small></p>`).join('') || 'Sem histórico'}</article>
  </section>`, 'bank');
}

function shopPage() {
  return shell('Loja', `<section class="shop-grid v3-shop-grid">${shopItems.map(i=>`
    <article class="shop-card v3-shop-card"><img src="/assets/v14/items/${i[0]}.png"><h2>${esc(i[1])}</h2><p>${esc(i[3])}</p><b>${oldMoney(i[2])}</b><button data-buy="${i[0]}">Comprar</button></article>`).join('')}</section>`, 'shop');
}

function levelsPage(){ return shell('Leveis', `<section class="panel v3-panel big"><h2>Nível ${state.member.level || 1}</h2><p>Ganhe XP jogando, viajando, atacando territórios e participando de eventos.</p><div class="level-bar"><i style="width:64%"></i></div></section>`, 'levels'); }
function familyPage(kind){ return shell(kind==='mafia'?'Máfias':'Famílias', `<section class="panel v3-panel big"><h2>Criar ${kind==='mafia'?'Máfia':'Família'}</h2><input id="familyName" value="${kind==='mafia'?'Máfia Sombra':'Família Kage'}"><button data-create-family="${kind}">Criar</button></section>`, kind==='mafia'?'mafias':'families'); }

function mapPage(){
  return shell('Mapa', `<section class="map-panel v3-map-panel"><img src="/assets/v14/bg/map_world.png">${territories.map(t=>`<a href="/travels?to=${t[0]}" style="left:${8+t[2]/14}%;top:${18+t[3]/8}%"><img src="/assets/v14/map/${t[0]}.png"><span>${esc(t[1])}</span></a>`).join('')}</section>`, 'map');
}

function travelsPage(){
  return shell('Viagens', `<section class="cards-grid v3-game-grid">${territories.map(t=>`<article class="shop-card v3-shop-card"><img src="/assets/v14/map/${t[0]}.png"><h2>${esc(t[1])}</h2><p>Distância: ${Math.round(Math.hypot(t[2],t[3]))} km</p><select id="travelItem_${t[0]}"><option value="">Normal</option>${Object.keys(travelItems).map(k=>`<option value="${k}">${k}</option>`).join('')}</select><button data-travel="${t[0]}">Viajar</button></article>`).join('')}</section>`, 'travels');
}

function attacksPage(){ return shell('Ataques', `<section class="cards-grid v3-game-grid">${territories.map(t=>`<article class="shop-card v3-shop-card"><img src="/assets/v14/map/${t[0]}.png"><h2>${esc(t[1])}</h2><button data-attack="${t[0]}">Atacar território</button></article>`).join('')}</section>`, 'attacks'); }
function marriagePage(){ return shell('Casamentos', `<section class="panel v3-panel big"><h2>Solicitar casamento</h2><input id="marryTarget" value="IrisQueen"><button data-marry>Enviar pedido</button></section>`, 'marriage'); }
function territoryPage(){ return shell('Conquistas de território', `<section class="cards-grid v3-game-grid">${territories.map(t=>`<article class="shop-card v3-shop-card"><img src="/assets/v14/map/${t[0]}.png"><h2>${esc(t[1])}</h2><p>Dono atual: Livre</p></article>`).join('')}</section>`, 'territory'); }

function adminPage(activeModule='dashboard'){
  const current = adminModules.find(m => m[0] === activeModule) || adminModules[0];
  return shell('Painel Admin', `
    <section class="v3-admin-layout">
      <aside class="v3-admin-menu">
        <h2>Menu Admin</h2>
        ${adminModules.map(m => `<a class="${m[0] === current[0] ? 'active' : ''}" href="/admin?module=${m[0]}"><b>${esc(m[1])}</b><span>${esc(m[2])}</span></a>`).join('')}
      </aside>
      <section class="v3-admin-content">
        <header class="v3-admin-head">
          <div><h2>${esc(current[1])}</h2><p>${esc(current[2])}</p></div>
          <button data-admin-sync>Atualizar painel</button>
        </header>
        ${adminModuleContent(current[0])}
      </section>
    </section>`, 'admin');
}

function adminModuleContent(module) {
  if (module === 'dashboard') return `
    <section class="v3-admin-stats">
      ${statCard('Usuários', '12.458', '+12,5%')}
      ${statCard('Depósitos', oldMoney(245780), '+8,2%')}
      ${statCard('Saques', oldMoney(96470), '+6,7%')}
      ${statCard('Novos', '1.245', '+15,3%')}
    </section>
    <section class="v3-chart-grid">
      <article class="v3-panel"><h3>Atividade ao vivo</h3><canvas id="adminActivityChart"></canvas></article>
      <article class="v3-panel"><h3>Financeiro</h3><canvas id="adminFinanceChart"></canvas></article>
      <article class="v3-panel"><h3>Jogos populares</h3><canvas id="adminGamesChart"></canvas></article>
      <article class="v3-panel"><h3>Status</h3><p>${state.sqlConnected ? 'Banco IRIS online.' : 'Banco IRIS offline. Ações reais bloqueadas.'}</p></article>
    </section>`;

  if (module === 'maintenance') return `<section class="v3-admin-cards"><article class="v3-panel"><h3>Manutenção por jogo</h3>${games.map(g=>`<label class="v3-check"><input type="checkbox" data-maint="${g[0]}" ${state.gameStatus[g[0]]?.maintenance?'checked':''}> <span>${esc(g[1])}</span></label>`).join('')}</article></section>`;

  if (module === 'radio') return `<section class="v3-admin-cards"><article class="v3-panel"><h3>Rádio global YouTube</h3><input id="radioTitle" value="Rádio Blinders"><input id="radioUrl" placeholder="Link do YouTube"><button data-radio-save>Aplicar música global</button><p>Quando o admin aplicar, todos recebem popup da música por 5 segundos.</p></article></section>`;

  if (module === 'shop' || module === 'items') return `<section class="v3-admin-cards"><article class="v3-panel"><h3>Alterar preço de item</h3><select id="priceItem">${shopItems.map(i=>`<option value="${i[0]}">${esc(i[1])}</option>`).join('')}</select><input id="priceValue" value="100b"><button data-price-save>Salvar preço</button></article><article class="v3-panel"><h3>Loja</h3><div class="v3-mini-items">${shopItems.slice(0,12).map(i=>`<img src="/assets/v14/items/${i[0]}.png">`).join('')}</div></article></section>`;

  if (module === 'bonus') return `<section class="v3-admin-cards"><article class="v3-panel"><h3>Bônus admin</h3><input id="bonusAmount" value="100b"><button data-bonus>Aplicar bônus</button></article></section>`;

  if (module === 'families' || module === 'mafias') return `<section class="v3-admin-cards"><article class="v3-panel"><h3>Criar ${module === 'mafias' ? 'Máfia' : 'Família'}</h3><input id="familyName" value="${module === 'mafias' ? 'Máfia Sombra' : 'Família Kage'}"><button data-create-family="${module === 'mafias' ? 'mafia' : 'family'}">Criar</button></article></section>`;

  if (module === 'travels') return `<section class="v3-admin-cards">${territories.slice(0,4).map(t=>`<article class="v3-panel"><img class="v3-icon" src="/assets/v14/map/${t[0]}.png"><h3>${esc(t[1])}</h3><select id="travelItem_${t[0]}"><option value="">Normal</option>${Object.keys(travelItems).map(k=>`<option value="${k}">${k}</option>`).join('')}</select><button data-travel="${t[0]}">Simular viagem</button></article>`).join('')}</section>`;

  if (module === 'attacks' || module === 'territories' || module === 'map') return `<section class="v3-admin-cards">${territories.map(t=>`<article class="v3-panel"><img class="v3-icon" src="/assets/v14/map/${t[0]}.png"><h3>${esc(t[1])}</h3><button data-attack="${t[0]}">Atacar / testar</button></article>`).join('')}</section>`;

  if (module === 'marriages') return `<section class="v3-admin-cards"><article class="v3-panel"><h3>Solicitar casamento</h3><input id="marryTarget" value="IrisQueen"><button data-marry>Enviar pedido</button></article></section>`;

  return `<section class="v3-admin-cards">
    <article class="v3-panel"><h3>${esc(moduleTitle(module))}</h3><p>Categoria restaurada no menu admin antigo. Pronta para conectar às ações SQL já existentes e aos próximos endpoints.</p><button data-admin-sync>Executar / atualizar</button></article>
    <article class="v3-panel"><h3>Controle rápido</h3><p>Este módulo mantém o painel completo sem expor ferramentas internas aos membros comuns.</p></article>
  </section>`;
}

function moduleTitle(module) {
  return (adminModules.find(m => m[0] === module) || ['','Módulo'])[1];
}

function statCard(label, value, delta) {
  return `<article class="v3-stat"><span>${esc(label)}</span><b>${esc(value)}</b><small>${esc(delta)}</small></article>`;
}

function bindLinks(){
  document.querySelectorAll('a[href^="/"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.pushState({},'',a.getAttribute('href'));route();}));
}

function bindActions(){
  document.querySelector('[data-menu]')?.addEventListener('click',()=>document.body.classList.toggle('menu-open'));
  document.querySelector('[data-logout]')?.addEventListener('click',()=>{ IrisSQL.logout(); history.pushState({},'', '/login'); route(); });
  document.querySelector('[data-install-app]')?.addEventListener('click',installApp);
  document.querySelector('[data-auth-form]')?.addEventListener('submit',submitAuth);
  document.querySelectorAll('#authPhone').forEach(input=>input.addEventListener('input',()=>{ input.value = maskPhone(input.value); }));
  document.querySelector('[data-radio-toggle]')?.addEventListener('click',()=>toast(state.radio.title ? `Rádio: ${state.radio.title}` : 'Nenhuma rádio ativa.', 'warn'));
  document.querySelector('[data-quick-transfer]')?.addEventListener('click',()=>doTransfer('#quickTo','#quickAmount'));
  document.querySelector('[data-bank="transfer"]')?.addEventListener('click',()=>doTransfer('#transferTo','#transferAmount'));
  document.querySelector('[data-bank="deposit"]')?.addEventListener('click',()=>doBank('deposit'));
  document.querySelector('[data-bank="withdraw"]')?.addEventListener('click',()=>doBank('withdraw'));
  document.querySelector('[data-play]')?.addEventListener('click',e=>play(e.currentTarget.dataset.play));
  document.querySelector('[data-bj-start]')?.addEventListener('click',blackjackStart);
  document.querySelector('[data-bj-hit]')?.addEventListener('click',blackjackHit);
  document.querySelector('[data-bj-stop]')?.addEventListener('click',blackjackStop);
  document.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>buy(b.dataset.buy)));
  document.querySelectorAll('[data-maint]').forEach(c=>c.addEventListener('change',()=>setMaintenance(c.dataset.maint,c.checked)));
  document.querySelector('[data-radio-save]')?.addEventListener('click',saveRadio);
  document.querySelector('[data-price-save]')?.addEventListener('click',savePrice);
  document.querySelector('[data-bonus]')?.addEventListener('click',bonus);
  document.querySelector('[data-admin-sync]')?.addEventListener('click',()=>toast('Painel atualizado.', 'good'));
  document.querySelector('[data-create-family]')?.addEventListener('click',e=>createFamily(e.currentTarget.dataset.createFamily));
  document.querySelectorAll('[data-travel]').forEach(b=>b.addEventListener('click',()=>travel(b.dataset.travel)));
  document.querySelectorAll('[data-attack]').forEach(b=>b.addEventListener('click',()=>attack(b.dataset.attack)));
  document.querySelector('[data-marry]')?.addEventListener('click',marry);
}

function initCarousel() {
  const track = document.querySelector('[data-carousel-track]');
  if (!track) return;
  document.querySelector('[data-car-left]')?.addEventListener('click', () => track.scrollBy({ left: -310, behavior: 'smooth' }));
  document.querySelector('[data-car-right]')?.addEventListener('click', () => track.scrollBy({ left: 310, behavior: 'smooth' }));
  let paused = false;
  track.addEventListener('pointerenter', () => paused = true);
  track.addEventListener('pointerleave', () => paused = false);
  setInterval(() => {
    if (paused || !document.body.contains(track)) return;
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 8) track.scrollTo({ left: 0, behavior: 'smooth' });
    else track.scrollBy({ left: 248, behavior: 'smooth' });
  }, 3600);
}

function initCharts() {
  const home = document.getElementById('homeActivityChart');
  if (home) {
    charts.push(new Chart(home, {
      type: 'line',
      data: { labels:['0s','5s','10s','15s','20s','25s'], datasets:[{ label:'Atividade', data:[8,12,9,16,14,22], tension:.45, borderWidth:2, fill:true }] },
      options: chartOptions(false)
    }));
  }
  const adminActivity = document.getElementById('adminActivityChart');
  if (adminActivity) charts.push(new Chart(adminActivity, { type:'line', data:{ labels:['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'], datasets:[{label:'Ações',data:[12,22,18,34,29,43,39], tension:.4, borderWidth:2}] }, options:chartOptions() }));
  const adminFinance = document.getElementById('adminFinanceChart');
  if (adminFinance) charts.push(new Chart(adminFinance, { type:'bar', data:{ labels:['Dep','Saq','Transf','Jogos'], datasets:[{label:'B',data:[245,96,180,320]}] }, options:chartOptions() }));
  const adminGames = document.getElementById('adminGamesChart');
  if (adminGames) charts.push(new Chart(adminGames, { type:'doughnut', data:{ labels:['Slots','Blackjack','Bingo','Crash'], datasets:[{data:[34,26,21,19]}] }, options:chartOptions() }));
}

function chartOptions(showLegend=true) {
  return {
    responsive:true,
    maintainAspectRatio:false,
    plugins:{ legend:{ display:showLegend, labels:{ color:'#f6d987' } } },
    scales:{ x:{ ticks:{ color:'#9aa8c9' }, grid:{ color:'rgba(125,56,255,.12)' } }, y:{ ticks:{ color:'#9aa8c9' }, grid:{ color:'rgba(125,56,255,.12)' } } }
  };
}

function destroyCharts() {
  charts.forEach(c => c.destroy());
  charts = [];
}


let deferredInstall = null;
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstall = event; });
async function installApp() {
  if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice.catch(() => null); deferredInstall = null; return; }
  toast('Use o menu do navegador e escolha instalar/adicionar à tela inicial.', 'warn');
}
function maskPhone(value) {
  const digits = String(value || '').replace(/\D/g,'').slice(0,11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `${digits.slice(0,2)} ${digits.slice(2)}`;
  return `${digits.slice(0,2)} ${digits.slice(2,7)}-${digits.slice(7)}`;
}
async function submitAuth(event) {
  event.preventDefault();
  const mode = event.currentTarget.dataset.authForm;
  let res;
  if (mode === 'register') res = await IrisSQL.register(document.querySelector('#authNick')?.value || '', document.querySelector('#authIris')?.value || '', document.querySelector('#authPhone')?.value || '', document.querySelector('#authPassword')?.value || '');
  else if (mode === 'repair') res = await IrisSQL.repairPassword(document.querySelector('#authLogin')?.value || '', document.querySelector('#authPhone')?.value || '', document.querySelector('#authPassword')?.value || '');
  else res = await IrisSQL.login(document.querySelector('#authLogin')?.value || '', document.querySelector('#authPassword')?.value || '');
  if (!res?.ok) { toast(res?.error || 'Não foi possível concluir.', 'bad'); return; }
  if (mode === 'repair') { toast('Senha reparada. Faça login.', 'good'); history.pushState({},'', '/login'); route(); return; }
  applyRemote(res); state.sqlConnected = true; state.sqlMessage = 'Banco IRIS online'; toast(mode === 'register' ? 'Conta criada.' : 'Login aprovado.', 'good'); history.pushState({},'', '/home'); route();
}

async function requireSql(action){
  if(!state.sqlConnected) {
    toast('Banco IRIS indisponível. Ação real bloqueada.', 'bad');
    return null;
  }
  const res = await action();
  if(!res?.ok) { toast(res?.error || 'Falha SQL.', 'bad'); return null; }
  return res;
}

async function doBank(type){
  const amount = parseMoney(document.querySelector(type==='deposit'?'#depositAmount':'#withdrawAmount')?.value);
  const info = document.querySelector(type==='deposit'?'#depositRef':'#withdrawDest')?.value || '';
  const res = await requireSql(()=> type==='deposit' ? IrisSQL.deposit(amount,info) : IrisSQL.withdraw(amount,info));
  if(res) await refresh(`${type==='deposit'?'Depósito registrado':'Saque solicitado'}.`);
}

async function doTransfer(toSel, amountSel){
  const to=document.querySelector(toSel)?.value || '';
  const amount=parseMoney(document.querySelector(amountSel)?.value);
  const res=await requireSql(()=>IrisSQL.transfer(to,amount));
  if(res) await refresh('Transferência enviada.');
}

async function play(key){
  const bet=parseMoney(document.querySelector('#bet')?.value);
  const choice=document.querySelector('#choice')?.value || 'default';
  let payload;
  if(key==='roulette') payload=roulette(bet,choice);
  else if(key==='dice') payload=dice(bet,choice);
  else if(key==='slots') payload=slots(bet);
  else if(key==='bingo') payload=bingo(bet, choice.split(',').map(n=>Number(n.trim())));
  else if(key==='memory') payload=memory(bet);
  else if(key==='crash') payload=crash(bet,Number(choice));
  else if(key==='poker') payload=poker(bet);
  else payload=poker(bet);
  const res=await requireSql(()=>IrisSQL.playGame(key,bet,choice,payload));
  if(res) { applyRemote(res); result(payload); }
}

function blackjackStart(){
  const bet=parseMoney(document.querySelector('#bet')?.value);
  blackjackState={bet, player:[drawCard(),drawCard()], dealer:[drawCard(),drawCard()]};
  renderBj(`Total: ${handValue(blackjackState.player)}.`);
}
function blackjackHit(){ if(!blackjackState)return toast('Inicie rodada.','bad'); blackjackState.player.push(drawCard()); if(handValue(blackjackState.player)>21) blackjackStop(); else renderBj(`Total: ${handValue(blackjackState.player)}.`); }
function renderBj(msg){ document.querySelector('#gameVisual').innerHTML=`<div class="cards">${blackjackState.player.map(c=>`<span>${c}</span>`).join('')}</div><div class="cards"><span>${blackjackState.dealer[0]}</span><span>?</span></div>`; document.querySelector('#gameResult').textContent=msg; }
async function blackjackStop(){ if(!blackjackState)return; const payload=blackjackFinish(blackjackState.bet,blackjackState.player,blackjackState.dealer); const res=await requireSql(()=>IrisSQL.playGame('blackjack',blackjackState.bet,'stand',payload)); if(res){ applyRemote(res); result(payload); } blackjackState=null; }

function result(payload){
  document.querySelector('#gameResult').innerHTML = `${esc(payload.message)}<br>Pagamento: ${oldMoney(payload.payout)}`;
  toast(payload.win ? `Vitória ${oldMoney(payload.payout)}` : 'Rodada encerrada.', payload.win?'good':'bad');
}

async function buy(key){ const res=await requireSql(()=>IrisSQL.buyItem(key)); if(res) await refresh('Item comprado.'); }
async function setMaintenance(game, locked){ const res=await requireSql(()=>IrisSQL.setGameMaintenance(game,locked)); if(res){ state.gameStatus[game]={maintenance:locked,live:!locked}; toast('Manutenção atualizada.','good'); } }
async function saveRadio(){ const t=document.querySelector('#radioTitle')?.value || ''; const u=document.querySelector('#radioUrl')?.value || ''; const res=await requireSql(()=>IrisSQL.setRadio(u,t)); if(res){ state.radio={title:t,youtubeUrl:u}; musicPopup(t); toast('Rádio global atualizada.','good'); } }
async function savePrice(){ const key=document.querySelector('#priceItem')?.value; const price=parseMoney(document.querySelector('#priceValue')?.value); const res=await requireSql(()=>IrisSQL.setItemPrice(key,price)); if(res) toast('Preço do item atualizado.','good'); }
async function bonus(){ const amount=parseMoney(document.querySelector('#bonusAmount')?.value); const res=await requireSql(()=>IrisSQL.adminBonus(amount)); if(res) await refresh('Bônus aplicado.'); }
async function createFamily(kind){ const name=document.querySelector('#familyName')?.value || ''; const res=await requireSql(()=>IrisSQL.createFamily(name,kind)); if(res) toast(`${kind==='mafia'?'Máfia':'Família'} criada.`, 'good'); }
async function travel(to){ const item=document.querySelector(`#travelItem_${to}`)?.value || ''; const res=await requireSql(()=>IrisSQL.startTravel(to,item)); if(res) toast(res.message || 'Viagem iniciada.','good'); }
async function attack(t){ const res=await requireSql(()=>IrisSQL.attackTerritory(t)); if(res) toast(res.message || 'Ataque registrado.','good'); }
async function marry(){ const target=document.querySelector('#marryTarget')?.value || ''; const res=await requireSql(()=>IrisSQL.marry(target)); if(res) toast('Pedido enviado.','good'); }

async function refresh(msg){ const r=await IrisSQL.wallet(); if(r?.ok){ applyRemote(r); toast(msg,'good'); route(); } }
function applyRemote(r){
  if(!r?.ok) return;
  state.sqlConnected=true;
  if(r.member) state.member={...state.member,...r.member};
  if(typeof r.balance==='number') state.balance=r.balance;
  if(typeof r.locked==='number') state.locked=r.locked;
  if(Array.isArray(r.transactions)) state.transactions=r.transactions;
  if(Array.isArray(r.ranking)) state.ranking=r.ranking.map(x=>[x.nick||x[0],Number(x.score||x[1]||0)]);
  if(r.gameStatus) state.gameStatus=r.gameStatus;
  if(r.radio) state.radio=r.radio;
}
async function pollRadio(){ if(!state.sqlConnected) return; const r=await IrisSQL.getRadio(); if(r?.ok && r.radio?.title && r.radio.title!==state.radio.title){ state.radio=r.radio; musicPopup(r.radio.title); } }

function showLoading(){ const e=document.createElement('div'); e.id='loading'; e.innerHTML='<section><b>BLINDERS</b><span id="loadingText">Carregando...</span><i><em id="loadingBar"></em></i></section>'; document.body.appendChild(e); }
function updateLoading(p,t){ document.querySelector('#loadingBar')?.style.setProperty('width',p+'%'); const el=document.querySelector('#loadingText'); if(el) el.textContent=t; }
function hideLoading(){ document.querySelector('#loading')?.remove(); }
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
window.addEventListener('popstate', route);
