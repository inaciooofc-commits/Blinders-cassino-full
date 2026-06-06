import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { startGame, finishGame } from '../api/games.js';
import { toast } from '../core/UI.js';
import { RuntimePerformance } from '../core/RuntimePerformance.js';

globalThis.PIXI = PIXI;

export class BaseGame {
  constructor({ key, name, icon, rules, choices }) {
    this.key = key;
    this.name = name;
    this.icon = icon;
    this.rules = rules;
    this.choices = choices;
    this.PIXI = PIXI;
    this.app = null;
    this.session = null;
    this.preview = null;
    this.running = false;
    this.domLayer = null;
    this.statusEl = null;
    this.overlay = null;
    this.ready = Promise.resolve();
    this.tickers = new Set();
  }

  mount(root) {
    root.innerHTML = `
      <section class="game-layout">
        <div class="game-stage-card pixi-engine-stage" data-game="${this.key}">
          <div class="game-hud">
            <span>${this.icon} ${this.name}</span>
            <span id="phase">Pronto</span>
            <span class="pixi-badge">PIXI ON</span>
          </div>
          <div class="pixi-wrap" id="pixiWrap"></div>
          <div class="dom-layer" id="domLayer"></div>
          <div class="game-overlay" id="gameOverlay"></div>
        </div>
        <aside class="game-side">
          <section class="panel">
            <h2>💰 Aposta</h2>
            <label>Valor <input id="betAmount" value="1500B" placeholder="Ex: 1B, 1500B, 1.5T"></label>
            <label>Escolha <select id="gameChoice">${this.choices.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}</select></label>
            <button class="primary" id="playBtn">🎮 Jogar com Pixi</button>
            <button class="ghost" id="specialBtn" style="display:none">💸 Ação</button>
            <button class="ghost" id="resetBtn">🔄 Reiniciar cena</button>
          </section>
          <section class="panel">
            <h2>📜 Regras</h2>
            <p>${this.rules}</p>
          </section>
          <section class="panel">
            <h2>📊 Status</h2>
            <div class="status-box" id="gameStatus">Aguardando aposta.</div>
          </section>
        </aside>
      </section>`;

    this.domLayer = root.querySelector('#domLayer');
    this.statusEl = root.querySelector('#gameStatus');
    this.overlay = root.querySelector('#gameOverlay');
    this.app = new PIXI.Application();

    this.ready = this.initPixi(root.querySelector('#pixiWrap'));

    root.querySelector('#playBtn')?.addEventListener('click', () => this.play());
    root.querySelector('#resetBtn')?.addEventListener('click', () => this.reset());
  }

  async initPixi(container) {
    if (!container) throw new Error('Pixi container não encontrado.');

    await this.app.init({
      resizeTo: container,
      backgroundAlpha: 0,
      antialias: RuntimePerformance.pixiAntialias(),
      autoDensity: true,
      resolution: RuntimePerformance.pixiResolution(),
      powerPreference: RuntimePerformance.low ? 'low-power' : 'high-performance',
      eventMode: 'passive'
    });

    container.appendChild(this.app.canvas);
    this.drawPixiTable(this.key);
    this.drawIdle();
  }

  width() {
    return this.app?.screen?.width || 800;
  }

  height() {
    return this.app?.screen?.height || 500;
  }

  clearPixi() {
    for (const ticker of this.tickers) {
      this.app?.ticker?.remove(ticker);
    }
    this.tickers.clear();
    this.app?.stage?.removeChildren();
  }

  addTicker(fn) {
    const wrapped = (...args) => {
      if (document.hidden) return;
      fn(...args);
    };
    wrapped.__original = fn;
    this.tickers.add(wrapped);
    this.app.ticker.add(wrapped);
    return wrapped;
  }

  removeTicker(fn) {
    for (const item of this.tickers) {
      if (item === fn || item.__original === fn) {
        this.tickers.delete(item);
        this.app?.ticker?.remove(item);
      }
    }
  }

  drawPixiTable(kind = 'default') {
    if (!this.app?.stage) return null;
    this.clearPixi();

    const w = this.width();
    const h = this.height();
    const g = new PIXI.Graphics();

    g.rect(0, 0, w, h).fill({ color: 0x050506, alpha: 0.42 });
    g.roundRect(24, 42, Math.max(40, w - 48), Math.max(40, h - 76), 34)
      .fill({ color: 0x070709, alpha: 0.64 })
      .stroke({ color: 0xd9a63a, alpha: 0.42, width: 2 });

    const ring = new PIXI.Graphics();
    ring.circle(w * 0.5, h * 0.52, Math.min(w, h) * 0.31)
      .stroke({ color: 0xd9a63a, alpha: 0.18, width: 3 });
    ring.circle(w * 0.5, h * 0.52, Math.min(w, h) * 0.21)
      .stroke({ color: 0xffffff, alpha: 0.08, width: 2 });

    for (let i = 0; i < (RuntimePerformance.low ? 10 : 24); i++) {
      const x = (i / 23) * w;
      g.moveTo(x, h * 0.18);
      g.lineTo(w - x, h * 0.88);
    }
    g.stroke({ color: 0xffffff, alpha: 0.018, width: 1 });

    const title = this.text(this.name, w * 0.5, h * 0.11, 28, 0xf7e2a8);
    title.alpha = 0.86;

    this.app.stage.addChildAt(g, 0);
    this.app.stage.addChildAt(ring, 1);

    return g;
  }

  pixiPanel(x, y, w, h, radius = 24) {
    const g = new PIXI.Graphics();
    g.roundRect(x, y, w, h, radius)
      .fill({ color: 0x0b0b0d, alpha: 0.78 })
      .stroke({ color: 0xd9a63a, alpha: 0.42, width: 2 });
    this.app.stage.addChild(g);
    return g;
  }

  pixiText(label, x, y, size = 42, color = 0xffe2a6) {
    return this.text(label, x, y, size, color);
  }

  text(label, x, y, size = 42, color = 0xffe2a6) {
    const t = new PIXI.Text({
      text: String(label),
      style: {
        fill: color,
        fontSize: size,
        fontWeight: '900',
        align: 'center',
        dropShadow: {
          color: '#000000',
          alpha: 0.65,
          blur: 8,
          distance: 3
        }
      }
    });
    t.anchor.set(0.5);
    t.x = x;
    t.y = y;
    this.app.stage.addChild(t);
    return t;
  }

  circle(x, y, r, color = 0xe2b85c, alpha = 1) {
    const g = new PIXI.Graphics();
    g.circle(0, 0, r).fill({ color, alpha });
    g.x = x;
    g.y = y;
    this.app.stage.addChild(g);
    return g;
  }

  rect(x, y, w, h, color = 0x111113, alpha = 1, radius = 16) {
    const g = new PIXI.Graphics();
    g.roundRect(0, 0, w, h, radius)
      .fill({ color, alpha })
      .stroke({ color: 0xd9a63a, alpha: 0.35, width: 2 });
    g.x = x;
    g.y = y;
    this.app.stage.addChild(g);
    return g;
  }

  pixiCard(label, x, y, faceUp = true) {
    const c = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.roundRect(-38, -56, 76, 112, 12)
      .fill({ color: faceUp ? 0xf8f3df : 0x161316, alpha: 1 })
      .stroke({ color: 0xd9a63a, alpha: 0.82, width: 2 });
    c.addChild(bg);

    const txt = new PIXI.Text({
      text: faceUp ? label : 'B',
      style: {
        fill: faceUp && /[♥♦]/.test(label) ? 0x9b111e : 0x111111,
        fontSize: 26,
        fontWeight: '900',
        align: 'center'
      }
    });
    txt.anchor.set(0.5);
    c.addChild(txt);
    c.x = x;
    c.y = y;
    this.app.stage.addChild(c);
    return c;
  }

  pixiDie(value, x, y) {
    const c = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.roundRect(-45, -45, 90, 90, 18).fill({ color: 0xf4ead0, alpha: 1 }).stroke({ color: 0xd9a63a, alpha: 0.85, width: 3 });
    c.addChild(bg);

    const points = {
      1: [[0,0]],
      2: [[-22,-22],[22,22]],
      3: [[-24,-24],[0,0],[24,24]],
      4: [[-24,-24],[24,-24],[-24,24],[24,24]],
      5: [[-25,-25],[25,-25],[0,0],[-25,25],[25,25]],
      6: [[-25,-28],[25,-28],[-25,0],[25,0],[-25,28],[25,28]]
    }[Number(value) || 1];

    for (const [px, py] of points) {
      const pip = new PIXI.Graphics();
      pip.circle(px, py, 7).fill({ color: 0x111111, alpha: 1 });
      c.addChild(pip);
    }

    c.x = x;
    c.y = y;
    this.app.stage.addChild(c);
    return c;
  }

  pixiBingoBall(n, x, y, r = 38) {
    const c = new PIXI.Container();
    const ball = new PIXI.Graphics();
    ball.circle(0, 0, r).fill({ color: 0xf5e1a3, alpha: 1 }).stroke({ color: 0xd9a63a, alpha: 0.9, width: 4 });
    const inner = new PIXI.Graphics();
    inner.circle(-r * 0.25, -r * 0.25, r * 0.24).fill({ color: 0xffffff, alpha: 0.35 });
    const txt = new PIXI.Text({ text: String(n).padStart(2, '0'), style: { fill: 0x050506, fontSize: r * 0.64, fontWeight: '900' } });
    txt.anchor.set(0.5);
    c.addChild(ball, inner, txt);
    c.x = x;
    c.y = y;
    this.app.stage.addChild(c);
    return c;
  }

  particleBurst(x, y, color = 0xd9a63a, count = 22) {
    count = RuntimePerformance.particleCount(count);
    if (document.hidden) return;
    for (let i = 0; i < count; i++) {
      const p = this.circle(x, y, 2 + Math.random() * 4, color, 0.9);
      const a = Math.random() * Math.PI * 2;
      const d = 40 + Math.random() * 100;
      gsap.to(p, {
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d,
        alpha: 0,
        duration: 0.55 + Math.random() * 0.45,
        ease: 'power2.out',
        onComplete: () => p.destroy()
      });
    }
  }

  setStatus(message) {
    if (this.statusEl) this.statusEl.innerHTML = message;
  }

  setPhase(message) {
    const el = document.querySelector('#phase');
    if (el) el.textContent = message;
  }

  showOverlay(html, type = '') {
    if (!this.overlay) return;
    this.overlay.className = `game-overlay show ${type}`;
    this.overlay.innerHTML = html;
  }

  hideOverlay() {
    if (!this.overlay) return;
    this.overlay.className = 'game-overlay';
    this.overlay.innerHTML = '';
  }

  async createSession() {
    const bet = document.querySelector('#betAmount')?.value || '1B';
    const choice = document.querySelector('#gameChoice')?.value || '';
    const data = await startGame(this.key, bet, choice);
    this.session = data.session;
    this.preview = data.preview || {};
    return data;
  }

  async finalize(extra = {}) {
    const data = await finishGame(this.session.id, extra);
    const result = data.result || {};
    this.setStatus(`
      <strong>${result.win ? '✅ Vitória registrada' : '❌ Derrota registrada'}</strong><br>
      Prêmio: ${result.prizeLabel || '0'}<br>
      TX: ${data.txCode || '-'}<br>
      Astral: ${data.astralCode || '-'}
    `);
    this.showOverlay(`
      <b>${result.win ? '✅ Vitória!' : '❌ Perdeu!'}</b><br>
      Prêmio: ${result.prizeLabel || '0'}<br>
      TX: ${data.txCode || '-'}<br>
      Astral: ${data.astralCode || '-'}
    `, result.win ? 'good' : 'bad');
    return data;
  }

  async play() {
    if (this.running) return;
    this.running = true;
    this.hideOverlay();

    try {
      await this.ready;
      this.setPhase('Banco IRIS');
      this.setStatus('🏦 Criando sessão no Banco IRIS...');
      await this.createSession();
      this.setPhase('PixiJS');
      await this.animate();
    } catch (error) {
      this.showOverlay(`⚠️ ${error.message}`, 'bad');
      this.setStatus(`⚠️ ${error.message}`);
      toast(error.message, 'bad');
    } finally {
      this.running = false;
    }
  }

  drawIdle() {}
  async animate() {}

  async reset() {
    await this.ready;
    this.hideOverlay();
    this.setPhase('Pronto');
    this.setStatus('Aguardando aposta.');
    if (this.domLayer) this.domLayer.innerHTML = '';
    this.drawPixiTable(this.key);
    this.drawIdle();
  }

  destroy() {
    for (const ticker of this.tickers) {
      this.app?.ticker?.remove(ticker);
    }
    this.tickers.clear();
    this.app?.destroy(true, { children: true, texture: false, textureSource: false });
    this.app = null;
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  tween(target, vars) {
    return new Promise(resolve => gsap.to(target, { ...vars, onComplete: resolve }));
  }
}
