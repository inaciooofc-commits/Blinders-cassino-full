import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';

export type PixiSceneKind = 'slots' | 'roulette' | 'blackjack' | 'lobby';

export class PixiCasinoEngine {
  private host: HTMLElement;
  private app: Application | null = null;
  private scene = new Container();

  constructor(host: HTMLElement) {
    this.host = host;
  }

  async mount(kind: PixiSceneKind = 'lobby') {
    await this.destroy();

    const app = new Application();
    await app.init({
      width: Math.max(320, this.host.clientWidth),
      height: Math.max(260, this.host.clientHeight || 360),
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2)
    });

    this.host.innerHTML = '';
    this.host.appendChild(app.canvas);
    this.app = app;
    this.scene = new Container();
    app.stage.addChild(this.scene);

    if (kind === 'slots') this.drawSlots();
    else if (kind === 'roulette') this.drawRoulette();
    else if (kind === 'blackjack') this.drawBlackjack();
    else this.drawLobby();

    app.ticker.add(() => {
      this.scene.rotation = Math.sin(performance.now() / 1800) * 0.004;
      this.scene.y = Math.sin(performance.now() / 1200) * 2;
    });
  }

  async destroy() {
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }
    this.host.innerHTML = '';
  }

  private get size() {
    return {
      w: this.app?.screen.width ?? 900,
      h: this.app?.screen.height ?? 360
    };
  }

  private panel(x: number, y: number, w: number, h: number, radius = 24) {
    const g = new Graphics();
    g.roundRect(x, y, w, h, radius);
    g.fill({ color: 0x07040f, alpha: 0.72 });
    g.stroke({ color: 0xffd700, alpha: 0.28, width: 3 });
    this.scene.addChild(g);
    return g;
  }

  private label(text: string, x: number, y: number, size = 24, color = '#ffd700') {
    const t = new Text({
      text,
      style: new TextStyle({ fill: color, fontSize: size, fontWeight: '900', letterSpacing: 2 })
    });
    t.anchor.set(0.5);
    t.x = x;
    t.y = y;
    this.scene.addChild(t);
    return t;
  }

  private drawLobby() {
    const { w, h } = this.size;
    this.panel(30, 30, w - 60, h - 60, 28);
    for (let i = 0; i < 18; i++) {
      const ring = new Graphics();
      ring.circle(w / 2, h / 2, 20 + i * 12);
      ring.stroke({ color: i % 2 ? 0xff4500 : 0x29a9ff, alpha: 0.05 + i * 0.004, width: 2 });
      this.scene.addChild(ring);
    }
    this.label('BLINDERS STUDIO ENGINE', w / 2, h / 2 - 10, 28);
    this.label('2D CANVAS / WEBGL LOBBY', w / 2, h / 2 + 30, 14, '#f8f4e8');
  }

  private drawSlots() {
    const { w, h } = this.size;
    this.panel(40, 40, w - 80, h - 80, 28);
    const start = w / 2 - 245;
    ['7', '忍', '炎'].forEach((sym, i) => {
      this.panel(start + i * 170, 90, 140, 170, 18);
      this.label(sym, start + i * 170 + 70, 175, 56, i === 0 ? '#ffd700' : '#ff4500');
    });
    this.label('CHAKRA REELS', w / 2, 310, 20);
  }

  private drawRoulette() {
    const { w, h } = this.size;
    const cx = w / 2;
    const cy = h / 2;
    for (let i = 0; i < 36; i++) {
      const g = new Graphics();
      g.arc(cx, cy, 120, (i / 36) * Math.PI * 2, ((i + 1) / 36) * Math.PI * 2);
      g.stroke({ color: i % 2 ? 0xff4500 : 0x07040f, alpha: 0.9, width: 12 });
      this.scene.addChild(g);
    }
    const core = new Graphics();
    core.circle(cx, cy, 70);
    core.fill({ color: 0x080410, alpha: 0.92 });
    core.stroke({ color: 0xffd700, alpha: 0.45, width: 4 });
    this.scene.addChild(core);
    this.label('ROULETTE', cx, cy, 22);
  }

  private drawBlackjack() {
    const { w, h } = this.size;
    this.panel(40, 40, w - 80, h - 80, 28);
    for (let i = 0; i < 5; i++) {
      const x = w / 2 - 220 + i * 110;
      this.panel(x, h / 2 - 75, 82, 126, 12);
      this.label(['A', 'K', 'Q', 'J', '10'][i], x + 41, h / 2 - 12, 34, '#8b0000');
    }
    this.label('KAGE BLACKJACK', w / 2, h - 55, 20);
  }
}
