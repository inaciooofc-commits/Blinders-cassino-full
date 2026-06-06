import { BaseGame } from './BaseGame.js';

export class SlotsGame extends BaseGame {
  constructor() {
    super({
      key: 'slots',
      name: 'Slots Real',
      icon: '🎰',
      rules: 'Rolos descem e param em sequência. Dois iguais pagam, três iguais pagam mais.',
      choices: [{ value: 'spin', label: 'Girar' }]
    });
  }

  drawIdle() {
    this.drawPixiTable('slots');
    this.drawReels(['🍒', '🔔', '⭐']);
  }

  drawReels(symbols) {
    const w = this.width();
    const h = this.height();
    const reels = [];
    const startX = w / 2 - 130;

    for (let i = 0; i < 3; i++) {
      this.rect(startX + i * 130, h / 2 - 90, 104, 150, 22);
      const t = this.text(symbols[i] || '🎰', startX + i * 130 + 52, h / 2 - 14, 52);
      reels.push(t);
    }

    return reels;
  }

  async animate() {
    await this.ready;
    this.drawPixiTable('slots');
    this.domLayer.innerHTML = '<div class="slot-machine pixi-slot-note"><div>🎰</div><div>🎰</div><div>🎰</div></div>';
    const symbols = ['🍒', '🔔', '⭐', '💎', '7️⃣', '🍋', '👑'];
    const final = this.preview.reels || ['🍒','🔔','⭐'];
    const reels = this.drawReels(['🎰','🎰','🎰']);

    for (let i = 0; i < reels.length; i++) {
      const start = performance.now();
      const duration = 900 + i * 420;
      await new Promise(resolve => {
        const loop = t => {
          reels[i].text = symbols[Math.floor(Math.random() * symbols.length)];
          reels[i].y = this.height() / 2 - 14 + Math.sin(t / 36) * 10;
          reels[i].scale.set(1 + Math.sin(t / 45) * .05);
          if (t - start < duration) requestAnimationFrame(loop);
          else {
            reels[i].text = final[i];
            reels[i].scale.set(1);
            reels[i].y = this.height() / 2 - 14;
            this.particleBurst(reels[i].x, reels[i].y, 0xd9a63a, 10);
            resolve();
          }
        };
        requestAnimationFrame(loop);
      });
    }

    await this.wait(500);
    await this.finalize({});
  }
}
