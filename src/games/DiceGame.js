import { BaseGame } from './BaseGame.js';

export class DiceGame extends BaseGame {
  constructor() {
    super({
      key: 'dice',
      name: 'Dados Real',
      icon: '🎲',
      rules: 'Dados rolam e param com soma final destacada.',
      choices: [
        { value: 'high', label: 'Alto' }, { value: 'low', label: 'Baixo' },
        { value: 'even', label: 'Par' }, { value: 'odd', label: 'Ímpar' },
        { value: '7', label: 'Soma 7' }, { value: '12', label: 'Soma 12' }
      ]
    });
  }

  drawIdle() {
    this.drawPixiTable('dice');
    this.pixiDie(1, this.width() / 2 - 60, this.height() / 2);
    this.pixiDie(1, this.width() / 2 + 60, this.height() / 2);
  }

  async animate() {
    await this.ready;
    this.drawPixiTable('dice');
    this.domLayer.innerHTML = '<div class="dice-total" id="diceTotal">🎲 Rolando...</div>';
    const dice = this.preview.dice || [1, 1];
    let d1 = this.pixiDie(1, this.width()/2 - 70, this.height()/2);
    let d2 = this.pixiDie(1, this.width()/2 + 70, this.height()/2);
    const start = performance.now();

    await new Promise(resolve => {
      const loop = t => {
        d1.destroy();
        d2.destroy();
        const v1 = 1 + Math.floor(Math.random() * 6);
        const v2 = 1 + Math.floor(Math.random() * 6);
        d1 = this.pixiDie(v1, this.width()/2 - 70 + Math.sin(t/40)*22, this.height()/2 + Math.cos(t/36)*18);
        d2 = this.pixiDie(v2, this.width()/2 + 70 + Math.cos(t/44)*22, this.height()/2 + Math.sin(t/38)*18);
        d1.rotation = t / 180;
        d2.rotation = -t / 170;

        if (t - start < 1550) requestAnimationFrame(loop);
        else resolve();
      };
      requestAnimationFrame(loop);
    });

    d1.destroy();
    d2.destroy();
    this.pixiDie(dice[0] || 1, this.width()/2 - 70, this.height()/2);
    this.pixiDie(dice[1] || 1, this.width()/2 + 70, this.height()/2);
    const total = (dice[0] || 1) + (dice[1] || 1);
    document.querySelector('#diceTotal').textContent = `Soma: ${total}`;
    this.text(`Soma ${total}`, this.width()/2, this.height()/2 + 120, 42);
    this.particleBurst(this.width()/2, this.height()/2, 0xd9a63a, 28);
    await this.wait(500);
    await this.finalize({});
  }
}
