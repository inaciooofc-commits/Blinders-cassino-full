import { gsap } from 'gsap';
import { BaseGame } from './BaseGame.js';

export class RouletteGame extends BaseGame {
  constructor() {
    super({
      key: 'roulette',
      name: 'Roleta Real',
      icon: '🎡',
      rules: 'A roda e a bolinha giram. Cores/par/ímpar pagam 2x; número cheio paga 36x.',
      choices: [
        { value: 'red', label: 'Vermelho' }, { value: 'black', label: 'Preto' },
        { value: 'even', label: 'Par' }, { value: 'odd', label: 'Ímpar' },
        { value: '7', label: 'Número 7' }, { value: '21', label: 'Número 21' }
      ]
    });
  }

  drawIdle() {
    this.drawPixiTable('roulette');
    this.drawWheel('?');
  }

  drawWheel(centerText = '?') {
    const w = this.width();
    const h = this.height();
    const cx = w / 2;
    const cy = h / 2 + 20;
    const r = Math.min(w, h) * 0.28;

    const wheel = new this.PIXI.Container();
    wheel.x = cx;
    wheel.y = cy;

    const base = new this.PIXI.Graphics();
    base.circle(0, 0, r + 24).fill({ color: 0x090909, alpha: 0.95 }).stroke({ color: 0xd9a63a, width: 5, alpha: 0.75 });
    wheel.addChild(base);

    for (let i = 0; i < 37; i++) {
      const a = (Math.PI * 2 / 37) * i;
      const color = i === 0 ? 0x0b8f46 : (i % 2 ? 0x7e1119 : 0x111111);
      const seg = new this.PIXI.Graphics();
      seg.moveTo(0, 0);
      seg.arc(0, 0, r, a, a + Math.PI * 2 / 37 - 0.012);
      seg.lineTo(0, 0);
      seg.fill({ color, alpha: 0.96 });
      seg.stroke({ color: 0xd9a63a, alpha: 0.18, width: 1 });
      wheel.addChild(seg);
    }

    const inner = new this.PIXI.Graphics();
    inner.circle(0, 0, r * .42).fill({ color: 0x050506, alpha: 1 }).stroke({ color: 0xd9a63a, alpha: 0.7, width: 3 });
    wheel.addChild(inner);

    const num = new this.PIXI.Text({ text: String(centerText), style: { fill: 0xf7e2a8, fontSize: 42, fontWeight: '900' } });
    num.anchor.set(0.5);
    wheel.addChild(num);

    const ball = new this.PIXI.Graphics();
    ball.circle(0, -r - 14, 9).fill({ color: 0xffffff, alpha: 1 });
    wheel.addChild(ball);

    this.app.stage.addChild(wheel);
    return { wheel, ball, num, r };
  }

  async animate() {
    await this.ready;
    this.drawPixiTable('roulette');
    this.domLayer.innerHTML = '<div class="roulette-result">🎡 Girando...</div>';
    const resultNumber = this.preview.number ?? '?';
    const { wheel, ball, num, r } = this.drawWheel('?');

    gsap.to(wheel, { rotation: Math.PI * 9.2, duration: 2.8, ease: 'power4.out' });
    gsap.to(ball, { y: -r * .64, duration: 2.8, ease: 'power4.out' });
    gsap.to(ball, { rotation: -Math.PI * 18, duration: 2.8, ease: 'power4.out' });

    await this.wait(2850);
    num.text = String(resultNumber);
    this.domLayer.querySelector('.roulette-result').textContent = `Número vencedor: ${resultNumber}`;
    this.particleBurst(this.width()/2, this.height()/2, 0xd9a63a, 38);
    await this.wait(450);
    await this.finalize({});
  }
}
