import { gsap } from 'gsap';
import { BaseGame } from './BaseGame.js';

export class CoinGame extends BaseGame {
  constructor() {
    super({
      key: 'coin',
      name: 'Cara ou Coroa Real',
      icon: '🪙',
      rules: 'Moeda gira no eixo até revelar o resultado.',
      choices: [{ value: 'heads', label: 'Cara' }, { value: 'tails', label: 'Coroa' }]
    });
  }

  drawIdle() {
    this.drawPixiTable('coin');
    const coin = this.circle(this.width()/2, this.height()/2, 64, 0xd9a63a, 1);
    this.text('B', this.width()/2, this.height()/2, 54, 0x070708);
    return coin;
  }

  async animate() {
    await this.ready;
    this.drawPixiTable('coin');
    this.domLayer.innerHTML = '<div class="coin-result">🪙 Girando...</div>';
    const coin = this.circle(this.width()/2, this.height()/2, 70, 0xd9a63a, 1);
    const face = this.text('B', this.width()/2, this.height()/2, 58, 0x070708);

    gsap.to(coin.scale, { x: 0.08, duration: .18, repeat: 8, yoyo: true, ease: 'power1.inOut' });
    gsap.to(face.scale, { x: 0.08, duration: .18, repeat: 8, yoyo: true, ease: 'power1.inOut' });
    gsap.to(coin, { rotation: Math.PI * 10, duration: 1.65, ease: 'power2.inOut' });

    await this.wait(1700);
    const side = this.preview.side === 'heads' ? 'Cara' : 'Coroa';
    face.text = this.preview.side === 'heads' ? '🙂' : '👑';
    document.querySelector('.coin-result').textContent = side;
    this.particleBurst(this.width()/2, this.height()/2, 0xd9a63a, 28);
    await this.wait(450);
    await this.finalize({});
  }
}
