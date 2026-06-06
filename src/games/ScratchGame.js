import { BaseGame } from './BaseGame.js';

export class ScratchGame extends BaseGame {
  constructor() {
    super({
      key: 'scratch',
      name: 'Raspadinha Real',
      icon: '🎫',
      rules: 'Raspe com mouse/toque até revelar o prêmio.',
      choices: [{ value: 'scratch', label: 'Raspar' }]
    });
  }

  drawIdle() {
    this.drawPixiTable('scratch');
    this.pixiPanel(this.width()/2 - 180, this.height()/2 - 100, 360, 200, 28);
    this.text('🎫 Raspadinha', this.width()/2, this.height()/2 - 12, 42);
    this.domLayer.innerHTML = '<div class="scratch-wrap"><div class="prize">🎫 Prêmio oculto</div><canvas></canvas></div>';
  }

  async animate() {
    await this.ready;
    this.drawIdle();
    const wrap = this.domLayer.querySelector('.scratch-wrap');
    const prize = wrap.querySelector('.prize');
    prize.innerHTML = `${this.preview.symbol || '🎫'}<br><small>${this.preview.message || 'Prêmio revelado'}</small>`;

    const canvas = wrap.querySelector('canvas');
    const rect = wrap.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#bfc0c4';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.globalCompositeOperation = 'destination-out';

    let count = 0;
    this.setStatus('🎫 Raspe o bilhete até revelar o prêmio.');

    await new Promise(resolve => {
      const scratch = event => {
        const p = event.touches ? event.touches[0] : event;
        const r = canvas.getBoundingClientRect();
        const x = p.clientX - r.left;
        const y = p.clientY - r.top;
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, Math.PI * 2);
        ctx.fill();
        this.particleBurst(this.width()/2 - rect.width/2 + x, this.height()/2 - rect.height/2 + y, 0xffffff, 2);
        count += 1;
        if (count > 30) resolve();
      };
      canvas.addEventListener('pointerdown', scratch);
      canvas.addEventListener('pointermove', scratch);
    });

    ctx.clearRect(0, 0, rect.width, rect.height);
    this.particleBurst(this.width()/2, this.height()/2, 0xd9a63a, 34);
    await this.wait(500);
    await this.finalize({});
  }
}
