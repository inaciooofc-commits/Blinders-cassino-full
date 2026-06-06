import { BaseGame } from './BaseGame.js';
import { cashoutCrash } from '../api/games.js';

export class CrashGame extends BaseGame {
  constructor() {
    super({
      key: 'crash',
      name: 'Crash Real-Time',
      icon: '📈',
      rules: 'O multiplicador sobe ao vivo. Retire antes do crash para ganhar.',
      choices: [
        { value: '1.5', label: 'Retirada auto 1.5x' },
        { value: '2', label: 'Retirada auto 2x' },
        { value: '3', label: 'Retirada auto 3x' },
        { value: '5', label: 'Retirada auto 5x' }
      ]
    });
    this.cashoutDone = false;
  }

  drawIdle() {
    this.drawPixiTable('crash');
    const w = this.width();
    const h = this.height();
    this.text('🚀', w * .18, h * .72, 64);
    this.text('1.00x', w * .5, h * .42, 72);
    const grid = new this.PIXI.Graphics();
    for (let i = 0; i < 8; i++) {
      const y = h * .82 - i * 36;
      grid.moveTo(w * .1, y).lineTo(w * .9, y);
    }
    grid.stroke({ color: 0xd9a63a, alpha: 0.08, width: 1 });
    this.app.stage.addChild(grid);
  }

  async animate() {
    await this.ready;
    this.cashoutDone = false;
    const special = document.querySelector('#specialBtn');
    special.style.display = 'block';
    special.textContent = '💸 Retirar agora';
    special.onclick = () => this.cashout();

    const crashAt = Number(this.preview.crashAt || 2.3);
    const w = this.width();
    const h = this.height();

    this.drawPixiTable('crash');

    const line = new this.PIXI.Graphics();
    this.app.stage.addChild(line);

    const rocket = this.text('🚀', 70, h - 70, 54);
    const multiplier = this.text('1.00x', w / 2, h / 2, 86);
    const glow = this.circle(rocket.x, rocket.y, 22, 0xffd067, 0.25);
    const points = [];
    let elapsed = 0;

    this.setStatus('📈 Crash subindo em tempo real. Retire antes da queda.');

    await new Promise(resolve => {
      const ticker = () => {
        if (!this.running || this.cashoutDone) {
          this.removeTicker(ticker);
          resolve();
          return;
        }

        elapsed += this.app.ticker.deltaMS / 1000;
        const mult = Math.min(1 + elapsed * .72 + elapsed * elapsed * .09, crashAt);
        multiplier.text = mult.toFixed(2) + 'x';

        const p = Math.min((mult - 1) / Math.max(crashAt - 1, 1), 1);
        const x = 70 + (w - 150) * p;
        const y = h - 70 - (h - 160) * p;
        rocket.x = x;
        rocket.y = y;
        rocket.rotation = -0.42;
        glow.x = x;
        glow.y = y;
        points.push([x, y]);

        line.clear();
        line.moveTo(points[0]?.[0] || 70, points[0]?.[1] || h - 70);
        for (const point of points) line.lineTo(point[0], point[1]);
        line.stroke({ color: 0xd9a63a, width: 5, alpha: 0.9 });

        if (Math.random() > 0.65) this.particleBurst(x, y, 0xffd067, 2);

        if (mult >= crashAt) {
          this.removeTicker(ticker);
          rocket.text = '💥';
          rocket.rotation = 0;
          multiplier.text = 'CRASH!';
          multiplier.style.fill = '#ff8c9a';
          this.particleBurst(x, y, 0xff4757, 36);
          this.finalize({ crashedAt: crashAt, cashout: false }).then(resolve);
        }
      };

      this.addTicker(ticker);
    });

    special.style.display = 'none';
  }

  async cashout() {
    if (!this.session || this.cashoutDone) return;
    this.cashoutDone = true;
    const text = [...this.app.stage.children].find(c => String(c.text || '').includes('x'));
    const mult = Number(String(text?.text || '1x').replace('x', '')) || 1;
    const data = await cashoutCrash(this.session.id, mult);
    const result = data.result || {};
    this.particleBurst(this.width() / 2, this.height() / 2, 0x78e6a1, 44);
    this.showOverlay(`💸 Retirou em ${mult.toFixed(2)}x<br>Prêmio: ${result.prizeLabel || '0'}<br>TX: ${data.txCode || '-'}`, 'good');
    this.setStatus(`✅ Retirada feita em ${mult.toFixed(2)}x`);
  }
}
