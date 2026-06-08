import { Chart, registerables } from 'chart.js';
import { IrisSQL } from '../api/irisSql.js';
import { esc, oldMoney, parseMoney } from '../ui/format.js';
import { toast, musicPopup } from '../ui/toast.js';
import { games, roulette, dice, slots, drawCard, handValue, blackjackFinish, bingo, memory, crash, poker } from '../games/rules.js';
import { shopItems, territories, travelItems } from '../systems/catalog.js';
import { mountGameCanvas } from './Renderer.js';

Chart.register(...registerables);

const gameMeta = {
  roulette: ['Roleta', 'Mesa', 'Gire a roleta de chakra e escolha cor, paridade ou número.'],
  blackjack: ['Blackjack', 'Cartas', 'Chegue a 21. Peça carta ou pare contra a banca.'],
  bingo: ['Bingo', 'Sorteio', 'Escolha números de 1 a 100. Prêmios a partir de 3 acertos.'],
  dice: ['Dice', 'Mesa', 'Aposte em alto, baixo, par, ímpar ou soma exata.'],
  slots: ['Slots', 'Sorteio', 'Tambores ninja com linhas de pagamento.'],
  memory: ['Memory', '1x1', 'Encontre pares com até 3 erros.'],
  crash: ['Crash', 'Ao Vivo', 'Faça cashout antes do multiplicador quebrar.'],
  poker: ['Poker', 'Cartas', 'Mesa de cartas e duelos 1x1.']
};

const adminModules = [
  ['dashboard','Dashboard','Visão geral, gráficos e alertas do sistema.'],
  ['users','Usuários','Membros, cargos, status, telefone, nível e permissões.'],
  ['deposits','Depósitos','Aprovar, registrar, consultar e auditar depósitos.'],
  ['withdraws','Saques','Solicitações, destino, aprovação e bloqueio.'],
  ['transfers','Transferências','Movimento entre membros e rastreio de valores.'],
  ['games','Jogos','Regras, apostas, salas ao vivo e 1x1.'],
  ['maintenance','Manutenção dos jogos','Travar cada jogo sem derrubar o site.'],
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

const state = {
  sqlConnected: false,
  sqlMessage: 'Aguardando login',
  member: { nick: 'KageShinobi', iris: 'IRIS-KAGE-777', friendCode: 'KS-777', role: 'admin', level: 87 },
  balance: 25430.75,
  locked: 0,
  vipPoints: 12870,
  ranking: [['Shinigami_7',245780],['KageShinobi',189430],['AzulNeon',153920],['ShadowBR',99875],['IrisQueen',87610]],
  transactions: [],
  gameStatus: Object.fromEntries(games.map(g => [g[0], { maintenance:false, live:true, duel:true }])),
  radio: { title: '', youtubeUrl: '' },
  filter: 'Todos'
};

let blackjackState = null;
let charts = [];
let deferredInstall = null;

export async function boot() {
  showLoading();
  updateLoading(20, 'Carregando PNGs Ninja Release');
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
  updateLoading(72, 'Preparando layout premium');
  await wait(130);
  updateLoading(100, 'Finalizando');
  await wait(130);
  hideLoading();
  setInterval(pollRadio, 30000);
  pollRadio();
}

export function route() {
  const app = document.querySelector('#app');
  if (!app) throw new Error('Elemento #app não encontrado.');
  const path = location.pathname || '/';
  const q = new URLSearchParams(location.search);

  if (path === '/login') return render(app, authPage('login'));
  if (path === '/register') return render(app, authPage('register'));
  if (path === '/repair') return render(app, authPage('repair'));

  if (!IrisSQL.hasSession()) return render(app, authPage('login'));

  if (path === '/' || path === '/home') return render(app, homePage());
  if (path === '/games') return render(app, gamesPage(q.get('filter') || 'Todos'));
  if (path === '/game') return render(app, gamePage(q.get('game') || 'roulette'));
  if (path === '/bank') return render(app, bankPage(q.get('action') || 'wallet'));
  if (path === '/shop') return render(app, shopPage(q.get('cat') || 'Todos'));
  if (path === '/levels') return render(app, levelsPage());
  if (path === '/families') return render(app, groupPage('family'));
  if (path === '/mafias') return render(app, groupPage('mafia'));
  if (path === '/map') return render(app, mapPage());
  if (path === '/attacks') return render(app, attacksPage());
  if (path === '/travels') return render(app, travelsPage());
  if (path === '/marriage') return render(app, marriagePage());
  if (path === '/territory') return render(app, territoryPage());
  if (path === '/admin') return render(app, adminPage(q.get('module') || 'dashboard'));

  return render(app, shell('Página não encontrada', '<section class="v5-panel">Rota não encontrada.</section>', 'home'));
}

function render(app, html) {
  destroyCharts();
  app.innerHTML = html;
  bindLinks();
  bindActions();
  initCarousel();
  initCharts();
  initParticles();
  const canvas = document.querySelector('#pixiStage');
  if (canvas) mountGameCanvas(canvas, canvas.dataset.game || 'default');
}

function authPage(mode='login') {
  const isRegister = mode === 'register';
  const isRepair = mode === 'repair';
  const title = isRegister ? 'Criar conta' : isRepair ? 'Reparar senha' : 'Entrar';
  return `
  <main class="v5-auth">
    <canvas class="v5-particles" data-particles></canvas>
    <section class="v5-auth-card">
      <img class="v5-auth-logo" src="/assets/v16/logos/blinders-ninja-logo.png" alt="Blinders">
      <h1>${title}</h1>
      <p>${isRegister ? 'Crie sua conta para acessar o lançamento.' : isRepair ? 'Confirme telefone e defina uma nova senha.' : 'Acesse o Blinders Ninja Release.'}</p>
      <div class="v5-info-carousel">
        <div>
          <article><b>Banco IRIS</b><span>Saldo, transferência, depósito e saque em modo SQL.</span></article>
          <article><b>Mapa Ninja</b><span>Famílias, máfias, viagens, ataques e territórios.</span></article>
          <article><b>Jogos Premium</b><span>Mesas, carrossel, animações, 1x1 e ao vivo.</span></article>
        </div>
      </div>
      <form class="v5-auth-form" data-auth-form="${mode}">
        ${isRegister ? `
          <label><img src="/assets/v16/icons/profile.png">Nick<input id="authNick" required placeholder="Seu nick"></label>
          <label><img src="/assets/v16/icons/bank.png">Conta IRIS/Zarcovi<input id="authIris" required placeholder="IRIS-KAGE-777"></label>
          <label><img src="/assets/v16/icons/radio.png">Telefone<input id="authPhone" required placeholder="xx xxxxx-xxxx" maxlength="13"></label>
          <label><img src="/assets/v16/icons/login.png">Senha do app<input id="authPassword" type="password" required placeholder="Senha somente do app"></label>
          <label><img src="/assets/v16/icons/repair.png">Confirmar senha<input id="authConfirm" type="password" required placeholder="Confirmar senha"></label>
          <button type="submit">Criar conta</button>
        ` : isRepair ? `
          <label><img src="/assets/v16/icons/profile.png">Nick ou IRIS<input id="authLogin" required placeholder="KageShinobi ou IRIS-KAGE-777"></label>
          <label><img src="/assets/v16/icons/radio.png">Telefone cadastrado<input id="authPhone" required placeholder="xx xxxxx-xxxx" maxlength="13"></label>
          <label><img src="/assets/v16/icons/repair.png">Nova senha<input id="authPassword" type="password" required placeholder="Nova senha do app"></label>
          <button type="submit">Reparar senha</button>
        ` : `
          <label><img src="/assets/v16/icons/profile.png">Nick ou IRIS<input id="authLogin" required value="KageShinobi"></label>
          <label><img src="/assets/v16/icons/login.png">Senha<input id="authPassword" type="password" required placeholder="Senha do app"></label>
          <button type="submit">Entrar</button>
        `}
      </form>
      <nav class="v5-auth-links">
        <a href="/login">Entrar</a>
        <a href="/register">Criar Conta</a>
        <a href="/repair">Reparar Senha</a>
      </nav>
      <button class="v5-install" data-install-app>Instalar App</button>
      <small>Não use a senha real da sua conta Zarcovi. Use uma senha própria para este app.</small>
    </section>
  </main>`;
}

function shell(title, body, active='home') {
  return `
  <main class="v5-shell">
    <canvas class="v5-particles" data-particles></canvas>
    <aside class="v5-side">
      <a class="v5-brand" href="/home"><img src="/assets/v16/logos/blinders-ninja-logo.png"><b>BLINDERS</b><span>NINJA RELEASE</span></a>
      <nav class="v5-menu">
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
      <section class="v5-vip"><img src="/assets/v16/icons/vip.png"><b>DIAMANTE</b><span>${state.vipPoints.toLocaleString('pt-BR')} pts</span><i><em style="width:64%"></em></i></section>
    </aside>
    <section class="v5-main">
      <div class="v5-ticker"><b>ANÚNCIO GLOBAL</b><span>Torneio Blackjack ao vivo hoje • Rádio Blinders • Clãs e territórios ativos • Jackpot ${oldMoney(1458769.36)}</span></div>
      <header class="v5-topbar">
        <button data-menu>Menu</button>
        <div><b>${esc(state.member.nick)}</b><span>Nível ${state.member.level || 1}</span><span>Saldo ${oldMoney(state.balance)}</span><span class="${state.sqlConnected?'ok':'bad'}">${esc(state.sqlMessage)}</span></div>
        <nav><button data-install-app>Instalar</button><button data-radio-toggle>Rádio</button><button data-logout>Sair</button></nav>
      </header>
      ${body}
      <footer class="v5-footer"><span>Online agora 2.456</span><span>Jogadores hoje 12.364</span><span>Jackpot ${oldMoney(125347.89)}</span><span>Torneios ativos 3</span></footer>
    </section>
  </main>
  <div id="toastStack" class="toast-stack"></div>`;
}

function nav(h,label,icon,active) {
  const is = h.includes(active) || (active === 'home' && h === '/home');
  return `<a class="${is?'active':''}" href="${h}"><img src="/assets/v16/icons/${icon}.png"><span>${esc(label)}</span></a>`;
}

function homePage() {
  return shell('Home', `
    <section class="v5-home">
      <article class="v5-hero-card">
        <div><img src="/assets/v16/logos/blinders-ninja-logo.png"><h1>BLINDERS</h1><p>Cassino anime ninja premium</p><a href="/games">Jogar agora</a></div>
      </article>
      <aside class="v5-right">
        <article class="v5-panel"><h2>Ranking Semanal</h2>${state.ranking.map((r,i)=>`<p class="v5-rank"><b>${i+1}. ${esc(r[0])}</b><span>${oldMoney(r[1])}</span></p>`).join('')}<a href="/admin?module=ranking">Ver ranking</a></article>
        <article class="v5-panel"><h2>Atividade Recente</h2>${['ganhou no Blackjack','sacou no Banco IRIS','conquistou território','entrou no Bingo','comprou item VIP'].map((m,i)=>`<p class="v5-activity"><b>${state.ranking[i]?.[0] || 'Membro'}</b><span>${m}</span></p>`).join('')}</article>
      </aside>
      <section class="v5-section-title"><b>Jogos em destaque</b><span>Carrossel automático</span></section>
      <section class="v5-carousel-wrap">
        <button data-car-left>‹</button>
        <div class="v5-carousel" data-carousel-track>${games.map(g=>gameCard(g[0], true)).join('')}</div>
        <button data-car-right>›</button>
      </section>
      <section class="v5-dashboard-row">
        <article class="v5-panel v5-wallet"><img src="/assets/v16/icons/bank.png"><h2>Banco IRIS</h2><b>${oldMoney(state.balance)}</b><nav><a href="/bank?action=deposit">Depositar</a><a href="/bank?action=withdraw">Sacar</a><a href="/bank?action=transfer">Transferir</a></nav></article>
        <article class="v5-panel"><h2>Transferência entre membros</h2><input id="quickTo" value="Shinigami_7"><input id="quickAmount" value="10b"><button data-quick-transfer>Enviar transferência</button></article>
        <article class="v5-panel"><h2>Itens & Loja</h2><div class="v5-mini-items">${shopItems.slice(0,8).map(i=>`<img src="/assets/v16/items/${i[0]}.png">`).join('')}</div><a href="/shop">Ir para loja</a></article>
        <article class="v5-panel"><h2>Atividade</h2><canvas id="homeActivityChart"></canvas></article>
      </section>
    </section>`, 'home');
}

function gameCard(key, compact=false) {
  const meta = gameMeta[key] || [key, 'Todos', ''];
  const st = state.gameStatus[key] || {};
  return `<a class="v5-game-card ${st.maintenance?'locked':''} ${compact?'compact':''}" href="/game?game=${key}">
    <img src="/assets/v16/cards/${key}.png" alt="${esc(meta[0])}">
    <div><b>${esc(meta[0])}</b><span>${st.maintenance?'Manutenção':(st.live?'Ao Vivo':'Jogar')}</span></div>
  </a>`;
}

function gamesPage(filter='Todos') {
  const filters = ['Todos','Mesa','Sorteio','Cartas','1x1','Ao Vivo'];
  const list = games.filter(g => filter === 'Todos' || gameMeta[g[0]]?.[1] === filter || (filter === 'Ao Vivo' && state.gameStatus[g[0]]?.live));
  return shell('Jogos', `
    <section class="v5-hero-small"><h1>Salão de Jogos</h1><p>Mesas ninja, sorteios, cartas, 1x1 e salas ao vivo.</p></section>
    <nav class="v5-filters">${filters.map(f=>`<a class="${filter===f?'active':''}" href="/games?filter=${encodeURIComponent(f)}">${f}</a>`).join('')}</nav>
    <section class="v5-game-grid">${list.map(g=>gameCard(g[0])).join('')}</section>`, 'games');
}

function gamePage(key) {
  const meta = gameMeta[key] || ['Jogo','Todos',''];
  const locked = state.gameStatus[key]?.maintenance;
  return shell(meta[0], `
  <section class="v5-game-page">
    <article class="v5-game-table" style="background-image:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.78)),url('/assets/v16/tables/${key}-table.png')">
      <header><h1>${esc(meta[0])}</h1><p>${esc(meta[2])}</p><span>${locked ? 'Manutenção' : 'Disponível'}</span></header>
      <div id="pixiStage" data-game="${key}" class="pixi-stage"></div>
      <div id="gameVisual" class="game-visual">${gameVisual(key)}</div>
      <div class="v5-game-controls">
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
  <section class="v5-hero-small bank"><h1>Banco IRIS</h1><p>Saldo, depósito, saque, transferência e histórico.</p></section>
  <section class="v5-bank-grid">
    <article class="v5-panel v5-balance"><img src="/assets/v16/icons/bank.png"><h2>Saldo Total</h2><b>${oldMoney(state.balance)}</b><span>Bloqueado ${oldMoney(state.locked)}</span></article>
    <article class="v5-panel"><h2>Depósito</h2><input id="depositAmount" value="100b"><input id="depositRef" value="comprovante"><button data-bank="deposit">Registrar</button></article>
    <article class="v5-panel"><h2>Saque</h2><input id="withdrawAmount" value="10b"><input id="withdrawDest" value="Conta Zarcovi"><button data-bank="withdraw">Solicitar</button></article>
    <article class="v5-panel"><h2>Transferência</h2><input id="transferTo" value="Shinigami_7"><input id="transferAmount" value="10b"><button data-bank="transfer">Enviar</button></article>
    <article class="v5-panel"><h2>Movimento</h2><canvas id="bankChart"></canvas></article>
    <article class="v5-panel v5-history"><h2>Histórico</h2>${state.transactions.slice(0,20).map(t=>`<p><b>${esc(t.type)}</b><span>${oldMoney(t.amount)}</span><small>${esc(t.description||'')}</small></p>`).join('') || 'Sem histórico'}</article>
  </section>`, 'bank');
}

function shopPage(cat='Todos') {
  const cats = ['Todos','VIP','Viagem','Ataque','Defesa','Perfil','Família/Máfia','Evento'];
  return shell('Loja', `
    <section class="v5-hero-small shop"><h1>Loja Ninja</h1><p>30 itens PNG, raridades, locomoção, ataques, VIP e eventos.</p></section>
    <nav class="v5-filters">${cats.map(c=>`<a class="${cat===c?'active':''}" href="/shop?cat=${encodeURIComponent(c)}">${c}</a>`).join('')}</nav>
    <section class="v5-shop-grid">${shopItems.map((i,idx)=>shopCard(i, idx)).join('')}</section>`, 'shop');
}

function shopCard(i, idx) {
  const rarities = ['Comum','Raro','Épico','Lendário'];
  return `<article class="v5-shop-card"><img src="/assets/v16/items/${i[0]}.png"><h2>${esc(i[1])}</h2><p>${esc(i[3])}</p><span>${rarities[idx%4]}</span><b>${oldMoney(i[2])}</b><button data-buy="${i[0]}">Comprar</button></article>`;
}

function levelsPage(){ return shell('Leveis', `<section class="v5-panel big"><h2>Nível ${state.member.level || 1}</h2><p>Ganhe XP jogando, viajando, atacando territórios e participando de eventos.</p><div class="level-bar"><i style="width:64%"></i></div></section>`, 'levels'); }

function groupPage(kind){
  const label = kind === 'mafia' ? 'Máfias' : 'Famílias';
  return shell(label, `<section class="v5-hero-small"><h1>${label}</h1><p>Brasões, poder, ranking e domínio territorial.</p></section><section class="v5-clan-grid">${['Clã Cristal','Clã Sombrio','Clã IRIS','Máfia Neon','Família Kage','Ordem Azul'].map((n,i)=>`<article class="v5-panel"><img class="v5-clan" src="/assets/v16/clans/${slugLocal(n)}.png"><h2>${esc(n)}</h2><p>Poder ${oldMoney((i+1)*120)}</p></article>`).join('')}</section><section class="v5-panel"><h2>Criar ${kind==='mafia'?'Máfia':'Família'}</h2><input id="familyName" value="${kind==='mafia'?'Máfia Sombra':'Família Kage'}"><button data-create-family="${kind}">Criar</button></section>`, kind==='mafia'?'mafias':'families');
}

function mapPage(){
  return shell('Mapa', `<section class="v5-map"><img src="/assets/v16/bg/map.png">${territories.map(t=>`<a href="/travels?to=${t[0]}" style="left:${8+t[2]/14}%;top:${18+t[3]/8}%"><img src="/assets/v16/map/${t[0]}.png"><span>${esc(t[1])}</span></a>`).join('')}</section>`, 'map');
}

function travelsPage(){
  return shell('Viagens', `<section class="v5-game-grid">${territories.map(t=>`<article class="v5-shop-card"><img src="/assets/v16/map/${t[0]}.png"><h2>${esc(t[1])}</h2><p>Distância: ${Math.round(Math.hypot(t[2],t[3]))} km</p><select id="travelItem_${t[0]}"><option value="">Normal</option>${Object.keys(travelItems).map(k=>`<option value="${k}">${k}</option>`).join('')}</select><button data-travel="${t[0]}">Viajar</button></article>`).join('')}</section>`, 'travels');
}
function attacksPage(){ return shell('Ataques', `<section class="v5-game-grid">${territories.map(t=>`<article class="v5-shop-card"><img src="/assets/v16/map/${t[0]}.png"><h2>${esc(t[1])}</h2><button data-attack="${t[0]}">Atacar território</button></article>`).join('')}</section>`, 'attacks'); }
function marriagePage(){ return shell('Casamentos', `<section class="v5-panel big"><h2>Solicitar casamento</h2><input id="marryTarget" value="IrisQueen"><button data-marry>Enviar pedido</button></section>`, 'marriage'); }
function territoryPage(){ return shell('Conquistas de território', `<section class="v5-game-grid">${territories.map(t=>`<article class="v5-shop-card"><img src="/assets/v16/map/${t[0]}.png"><h2>${esc(t[1])}</h2><p>Dono atual: Livre</p></article>`).join('')}</section>`, 'territory'); }

function adminPage(activeModule='dashboard'){
  const current = adminModules.find(m => m[0] === activeModule) || adminModules[0];
  return shell('Painel Admin', `
    <section class="v5-admin">
      <aside class="v5-admin-menu">
        <h2>Menu Admin</h2>
        ${adminModules.map(m=>`<a class="${m[0]===current[0]?'active':''}" href="/admin?module=${m[0]}"><b>${esc(m[1])}</b><span>${esc(m[2])}</span></a>`).join('')}
      </aside>
      <section class="v5-admin-content">
        <header><div><h1>${esc(current[1])}</h1><p>${esc(current[2])}</p></div><button data-admin-sync>Atualizar</button></header>
        ${adminContent(current[0])}
      </section>
    </section>`, 'admin');
}

function adminContent(module) {
  if (module === 'dashboard') return `<section class="v5-admin-stats">${stat('Usuários','12.458','+12,5%')}${stat('Depósitos',oldMoney(245780),'+8,2%')}${stat('Saques',oldMoney(96470),'+6,7%')}${stat('Novos','1.245','+15,3%')}</section><section class="v5-chart-grid"><article class="v5-panel"><h3>Atividade</h3><canvas id="adminActivityChart"></canvas></article><article class="v5-panel"><h3>Financeiro</h3><canvas id="adminFinanceChart"></canvas></article><article class="v5-panel"><h3>Jogos</h3><canvas id="adminGamesChart"></canvas></article><article class="v5-panel"><h3>Status</h3><p>${state.sqlConnected?'Banco IRIS online.':'Banco IRIS offline. Ações reais bloqueadas.'}</p></article></section>`;
  if (module === 'maintenance') return `<section class="v5-admin-cards"><article class="v5-panel"><h3>Manutenção por jogo</h3>${games.map(g=>`<label class="v5-check"><input type="checkbox" data-maint="${g[0]}" ${state.gameStatus[g[0]]?.maintenance?'checked':''}> <span>${esc(gameMeta[g[0]]?.[0] || g[1])}</span></label>`).join('')}</article></section>`;
  if (module === 'radio') return `<section class="v5-admin-cards"><article class="v5-panel"><h3>Rádio global YouTube</h3><input id="radioTitle" value="Rádio Blinders"><input id="radioUrl" placeholder="Link do YouTube"><button data-radio-save>Aplicar música global</button><p>Todos recebem popup por 5 segundos.</p></article></section>`;
  if (module === 'shop' || module === 'items') return `<section class="v5-admin-cards"><article class="v5-panel"><h3>Alterar preço</h3><select id="priceItem">${shopItems.map(i=>`<option value="${i[0]}">${esc(i[1])}</option>`).join('')}</select><input id="priceValue" value="100b"><button data-price-save>Salvar preço</button></article><article class="v5-panel"><h3>Itens</h3><div class="v5-mini-items">${shopItems.slice(0,12).map(i=>`<img src="/assets/v16/items/${i[0]}.png">`).join('')}</div></article></section>`;
  if (module === 'bonus') return `<section class="v5-admin-cards"><article class="v5-panel"><h3>Bônus admin</h3><input id="bonusAmount" value="100b"><button data-bonus>Aplicar bônus</button></article></section>`;
  if (module === 'families' || module === 'mafias') return `<section class="v5-admin-cards"><article class="v5-panel"><h3>Criar ${module==='mafias'?'Máfia':'Família'}</h3><input id="familyName" value="${module==='mafias'?'Máfia Sombra':'Família Kage'}"><button data-create-family="${module==='mafias'?'mafia':'family'}">Criar</button></article></section>`;
  if (module === 'travels') return `<section class="v5-admin-cards">${territories.slice(0,4).map(t=>`<article class="v5-panel"><img class="v5-clan" src="/assets/v16/map/${t[0]}.png"><h3>${esc(t[1])}</h3><select id="travelItem_${t[0]}"><option value="">Normal</option>${Object.keys(travelItems).map(k=>`<option value="${k}">${k}</option>`).join('')}</select><button data-travel="${t[0]}">Simular viagem</button></article>`).join('')}</section>`;
  if (module === 'attacks' || module === 'territories' || module === 'map') return `<section class="v5-admin-cards">${territories.map(t=>`<article class="v5-panel"><img class="v5-clan" src="/assets/v16/map/${t[0]}.png"><h3>${esc(t[1])}</h3><button data-attack="${t[0]}">Atacar / testar</button></article>`).join('')}</section>`;
  if (module === 'marriages') return `<section class="v5-admin-cards"><article class="v5-panel"><h3>Solicitar casamento</h3><input id="marryTarget" value="IrisQueen"><button data-marry>Enviar pedido</button></article></section>`;
  return `<section class="v5-admin-cards"><article class="v5-panel"><h3>${esc((adminModules.find(m=>m[0]===module)||['','Módulo'])[1])}</h3><p>Painel visual restaurado. Conectado ao ecossistema do lançamento sem botão morto.</p><button data-admin-sync>Executar / atualizar</button></article><article class="v5-panel"><h3>Status</h3><p>Funções existentes preservadas. Próximos endpoints podem ser conectados sem mudar o visual.</p></article></section>`;
}

function stat(label,value,delta){ return `<article class="v5-stat"><span>${esc(label)}</span><b>${esc(value)}</b><small>${esc(delta)}</small></article>`; }

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

window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstall = event; });
async function installApp(){ if(deferredInstall){deferredInstall.prompt(); await deferredInstall.userChoice.catch(()=>null); deferredInstall=null;} else toast('Use o menu do navegador e escolha instalar/adicionar à tela inicial.', 'warn'); }
function maskPhone(value){ const d=String(value||'').replace(/\D/g,'').slice(0,11); if(d.length<=2)return d; if(d.length<=7)return `${d.slice(0,2)} ${d.slice(2)}`; return `${d.slice(0,2)} ${d.slice(2,7)}-${d.slice(7)}`; }

async function submitAuth(event){
  event.preventDefault();
  const mode=event.currentTarget.dataset.authForm;
  let res;
  if(mode==='register'){
    const password=document.querySelector('#authPassword')?.value||'';
    const confirm=document.querySelector('#authConfirm')?.value||'';
    if(password!==confirm){toast('As senhas não conferem.','bad');return;}
    res=await IrisSQL.register(document.querySelector('#authNick')?.value||'',document.querySelector('#authIris')?.value||'',document.querySelector('#authPhone')?.value||'',password);
  } else if(mode==='repair'){
    res=await IrisSQL.repairPassword(document.querySelector('#authLogin')?.value||'',document.querySelector('#authPhone')?.value||'',document.querySelector('#authPassword')?.value||'');
  } else {
    res=await IrisSQL.login(document.querySelector('#authLogin')?.value||'',document.querySelector('#authPassword')?.value||'');
  }
  if(!res?.ok){toast(res?.error||'Não foi possível concluir.','bad');return;}
  if(mode==='repair'){toast('Senha reparada. Faça login.','good');history.pushState({},'', '/login');route();return;}
  applyRemote(res);state.sqlConnected=true;state.sqlMessage='Banco IRIS online';toast(mode==='register'?'Conta criada.':'Login aprovado.','good');history.pushState({},'', '/home');route();
}

function initCarousel(){
  const track=document.querySelector('[data-carousel-track]');
  if(!track)return;
  document.querySelector('[data-car-left]')?.addEventListener('click',()=>track.scrollBy({left:-330,behavior:'smooth'}));
  document.querySelector('[data-car-right]')?.addEventListener('click',()=>track.scrollBy({left:330,behavior:'smooth'}));
  let paused=false; track.addEventListener('pointerenter',()=>paused=true); track.addEventListener('pointerleave',()=>paused=false);
  setInterval(()=>{if(paused||!document.body.contains(track))return;if(track.scrollLeft+track.clientWidth>=track.scrollWidth-8)track.scrollTo({left:0,behavior:'smooth'});else track.scrollBy({left:270,behavior:'smooth'});},3600);
}

function initCharts(){
  const h=document.getElementById('homeActivityChart'); if(h)charts.push(new Chart(h,{type:'line',data:{labels:['0s','5s','10s','15s','20s','25s'],datasets:[{label:'Atividade',data:[8,12,9,16,14,22],tension:.45,borderWidth:2,fill:true}]},options:chartOptions(false)}));
  const b=document.getElementById('bankChart'); if(b)charts.push(new Chart(b,{type:'bar',data:{labels:['Dep','Saq','Transf','Jogos'],datasets:[{label:'Movimento',data:[245,96,180,320]}]},options:chartOptions()}));
  const a=document.getElementById('adminActivityChart'); if(a)charts.push(new Chart(a,{type:'line',data:{labels:['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],datasets:[{label:'Ações',data:[12,22,18,34,29,43,39],tension:.4,borderWidth:2}]},options:chartOptions()}));
  const f=document.getElementById('adminFinanceChart'); if(f)charts.push(new Chart(f,{type:'bar',data:{labels:['Dep','Saq','Transf','Jogos'],datasets:[{label:'B',data:[245,96,180,320]}]},options:chartOptions()}));
  const g=document.getElementById('adminGamesChart'); if(g)charts.push(new Chart(g,{type:'doughnut',data:{labels:['Slots','Blackjack','Bingo','Crash'],datasets:[{data:[34,26,21,19]}]},options:chartOptions()}));
}
function chartOptions(showLegend=true){return{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:showLegend,labels:{color:'#f6d987'}}},scales:{x:{ticks:{color:'#9aa8c9'},grid:{color:'rgba(125,56,255,.12)'}},y:{ticks:{color:'#9aa8c9'},grid:{color:'rgba(125,56,255,.12)'}}}}}
function destroyCharts(){charts.forEach(c=>c.destroy());charts=[];}

function initParticles(){
  const canvas=document.querySelector('[data-particles]'); if(!canvas)return;
  const ctx=canvas.getContext('2d'); let w=0,h=0,parts=[];
  const resize=()=>{w=canvas.width=canvas.offsetWidth*devicePixelRatio;h=canvas.height=canvas.offsetHeight*devicePixelRatio;parts=Array.from({length:42},()=>({x:Math.random()*w,y:Math.random()*h,r:1+Math.random()*3,v:.25+Math.random()*.65,a:Math.random()*Math.PI*2}));};
  resize(); window.addEventListener('resize',resize,{passive:true});
  const tick=()=>{if(!document.body.contains(canvas))return;ctx.clearRect(0,0,w,h);for(const p of parts){p.y-=p.v*devicePixelRatio;p.x+=Math.sin(p.a+=.01)*.25*devicePixelRatio;if(p.y<0)p.y=h;ctx.beginPath();ctx.fillStyle='rgba(64,180,255,.35)';ctx.arc(p.x,p.y,p.r*devicePixelRatio,0,Math.PI*2);ctx.fill();}requestAnimationFrame(tick);}; tick();
}

async function requireSql(action){ if(!state.sqlConnected){toast('Banco IRIS indisponível. Ação real bloqueada.','bad');return null;} const res=await action(); if(!res?.ok){toast(res?.error||'Falha SQL.','bad');return null;} return res; }
async function doBank(type){const amount=parseMoney(document.querySelector(type==='deposit'?'#depositAmount':'#withdrawAmount')?.value),info=document.querySelector(type==='deposit'?'#depositRef':'#withdrawDest')?.value||'';const res=await requireSql(()=>type==='deposit'?IrisSQL.deposit(amount,info):IrisSQL.withdraw(amount,info));if(res)await refresh(type==='deposit'?'Depósito registrado.':'Saque solicitado.');}
async function doTransfer(toSel,amountSel){const to=document.querySelector(toSel)?.value||'',amount=parseMoney(document.querySelector(amountSel)?.value);const res=await requireSql(()=>IrisSQL.transfer(to,amount));if(res)await refresh('Transferência enviada.');}
async function play(key){const bet=parseMoney(document.querySelector('#bet')?.value),choice=document.querySelector('#choice')?.value||'default';let payload;if(key==='roulette')payload=roulette(bet,choice);else if(key==='dice')payload=dice(bet,choice);else if(key==='slots')payload=slots(bet);else if(key==='bingo')payload=bingo(bet,choice.split(',').map(n=>Number(n.trim())));else if(key==='memory')payload=memory(bet);else if(key==='crash')payload=crash(bet,Number(choice));else if(key==='poker')payload=poker(bet);else payload=poker(bet);const res=await requireSql(()=>IrisSQL.playGame(key,bet,choice,payload));if(res){applyRemote(res);result(payload);}}
function blackjackStart(){const bet=parseMoney(document.querySelector('#bet')?.value);blackjackState={bet,player:[drawCard(),drawCard()],dealer:[drawCard(),drawCard()]};renderBj(`Total: ${handValue(blackjackState.player)}.`);}
function blackjackHit(){if(!blackjackState)return toast('Inicie rodada.','bad');blackjackState.player.push(drawCard());if(handValue(blackjackState.player)>21)blackjackStop();else renderBj(`Total: ${handValue(blackjackState.player)}.`);}
function renderBj(msg){document.querySelector('#gameVisual').innerHTML=`<div class="cards">${blackjackState.player.map(c=>`<span>${c}</span>`).join('')}</div><div class="cards"><span>${blackjackState.dealer[0]}</span><span>?</span></div>`;document.querySelector('#gameResult').textContent=msg;}
async function blackjackStop(){if(!blackjackState)return;const payload=blackjackFinish(blackjackState.bet,blackjackState.player,blackjackState.dealer);const res=await requireSql(()=>IrisSQL.playGame('blackjack',blackjackState.bet,'stand',payload));if(res){applyRemote(res);result(payload);}blackjackState=null;}
function result(payload){document.querySelector('#gameResult').innerHTML=`${esc(payload.message)}<br>Pagamento: ${oldMoney(payload.payout)}`;toast(payload.win?`Vitória ${oldMoney(payload.payout)}`:'Rodada encerrada.',payload.win?'good':'bad');}
async function buy(key){const res=await requireSql(()=>IrisSQL.buyItem(key));if(res)await refresh('Item comprado.');}
async function setMaintenance(game,locked){const res=await requireSql(()=>IrisSQL.setGameMaintenance(game,locked));if(res){state.gameStatus[game]={maintenance:locked,live:!locked};toast('Manutenção atualizada.','good');}}
async function saveRadio(){const t=document.querySelector('#radioTitle')?.value||'',u=document.querySelector('#radioUrl')?.value||'',res=await requireSql(()=>IrisSQL.setRadio(u,t));if(res){state.radio={title:t,youtubeUrl:u};musicPopup(t);toast('Rádio global atualizada.','good');}}
async function savePrice(){const key=document.querySelector('#priceItem')?.value,price=parseMoney(document.querySelector('#priceValue')?.value),res=await requireSql(()=>IrisSQL.setItemPrice(key,price));if(res)toast('Preço do item atualizado.','good');}
async function bonus(){const amount=parseMoney(document.querySelector('#bonusAmount')?.value),res=await requireSql(()=>IrisSQL.adminBonus(amount));if(res)await refresh('Bônus aplicado.');}
async function createFamily(kind){const name=document.querySelector('#familyName')?.value||'',res=await requireSql(()=>IrisSQL.createFamily(name,kind));if(res)toast(`${kind==='mafia'?'Máfia':'Família'} criada.`,'good');}
async function travel(to){const item=document.querySelector(`#travelItem_${to}`)?.value||'',res=await requireSql(()=>IrisSQL.startTravel(to,item));if(res)toast(res.message||'Viagem iniciada.','good');}
async function attack(t){const res=await requireSql(()=>IrisSQL.attackTerritory(t));if(res)toast(res.message||'Ataque registrado.','good');}
async function marry(){const target=document.querySelector('#marryTarget')?.value||'',res=await requireSql(()=>IrisSQL.marry(target));if(res)toast('Pedido enviado.','good');}
async function refresh(msg){const r=await IrisSQL.wallet();if(r?.ok){applyRemote(r);toast(msg,'good');route();}}
function applyRemote(r){if(!r?.ok)return;state.sqlConnected=true;if(r.member)state.member={...state.member,...r.member};if(typeof r.balance==='number')state.balance=r.balance;if(typeof r.locked==='number')state.locked=r.locked;if(Array.isArray(r.transactions))state.transactions=r.transactions;if(Array.isArray(r.ranking))state.ranking=r.ranking.map(x=>[x.nick||x[0],Number(x.score||x[1]||0)]);if(r.gameStatus)state.gameStatus=r.gameStatus;if(r.radio)state.radio=r.radio;}
async function pollRadio(){if(!state.sqlConnected)return;const r=await IrisSQL.getRadio();if(r?.ok&&r.radio?.title&&r.radio.title!==state.radio.title){state.radio=r.radio;musicPopup(r.radio.title);}}
function showLoading(){const e=document.createElement('div');e.id='loading';e.innerHTML='<section><img src="/assets/v16/logos/blinders-ninja-logo.png"><b>BLINDERS</b><span id="loadingText">Carregando...</span><i><em id="loadingBar"></em></i></section>';document.body.appendChild(e);}
function updateLoading(p,t){document.querySelector('#loadingBar')?.style.setProperty('width',p+'%');const el=document.querySelector('#loadingText');if(el)el.textContent=t;}
function hideLoading(){document.querySelector('#loading')?.remove();}
function wait(ms){return new Promise(r=>setTimeout(r,ms));}
function slugLocal(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');}
window.addEventListener('popstate', route);
