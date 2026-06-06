import { BaseGame } from './BaseGame.js';

const SYMBOLS = ['♠','♥','♦','♣','★','◆','●','▲'];

export class MemoryGame extends BaseGame {
  constructor() {
    super({
      key: 'memory',
      name: 'Memória de Pares',
      icon: '🧠',
      rules: 'Escolha cartas para formar pares. Você pode errar até 3 vezes antes de perder.',
      choices: [{ value: 'pairs', label: 'Pares com 3 erros' }]
    });
    this.cards = [];
    this.flipped = [];
    this.matched = new Set();
    this.errors = 0;
    this.locked = false;
  }

  drawIdle() {
    this.drawPixiTable('memory');
    const w = this.width();
    const h = this.height();
    for (let i = 0; i < 16; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = w / 2 - 150 + col * 100;
      const y = h / 2 - 110 + row * 72;
      const card = this.rect(x - 34, y - 42, 68, 58, 0x15120d, 0.82, 12);
      card.alpha = 0.45;
    }

    this.cards = this.cards.length ? this.cards : this.makeCards();
    this.domLayer.innerHTML = `
      <div class="memory-scene">
        <div class="memory-hud">
          <span>✅ Pares: <b id="memoryPairs">0</b>/8</span>
          <span>❌ Erros: <b id="memoryErrors">0</b>/3</span>
        </div>
        <div class="memory-grid memory-pairs-grid">
          ${this.cards.map((card, i) => `
            <button type="button" class="memory-tile" data-i="${i}">
              <span class="front">B</span>
              <span class="back">${card}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  async animate() {
    await this.ready;
    this.cards = Array.isArray(this.preview.cards) && this.preview.cards.length ? this.preview.cards : this.makeCards();
    this.flipped = [];
    this.matched = new Set();
    this.errors = 0;
    this.locked = false;

    this.drawIdle();
    this.updateHud();
    this.setStatus('🧠 Escolha dois cards para tentar formar pares. Até 3 erros são permitidos.');

    this.domLayer.querySelectorAll('.memory-tile').forEach(tile => {
      tile.addEventListener('click', () => this.pick(Number(tile.dataset.i)));
    });
  }

  async pick(index) {
    if (this.locked || this.matched.has(index) || this.flipped.includes(index)) return;

    const tile = this.domLayer.querySelector(`[data-i="${index}"]`);
    tile?.classList.add('revealed');
    this.flipped.push(index);
    this.particleBurst(tile ? this.width()/2 : this.width()/2, this.height()/2, 0xd9a63a, 4);

    if (this.flipped.length < 2) return;

    this.locked = true;
    const [a, b] = this.flipped;
    const ok = this.cards[a] === this.cards[b];

    await this.wait(560);

    if (ok) {
      this.matched.add(a);
      this.matched.add(b);
      this.domLayer.querySelector(`[data-i="${a}"]`)?.classList.add('matched');
      this.domLayer.querySelector(`[data-i="${b}"]`)?.classList.add('matched');
      this.particleBurst(this.width()/2, this.height()/2, 0x78e6a1, 18);
      this.setStatus('✅ Par encontrado!');
    } else {
      this.errors += 1;
      this.domLayer.querySelector(`[data-i="${a}"]`)?.classList.remove('revealed');
      this.domLayer.querySelector(`[data-i="${b}"]`)?.classList.remove('revealed');
      this.particleBurst(this.width()/2, this.height()/2, 0xff8c9a, 10);
      this.setStatus(`❌ Erro ${this.errors}/3. Continue tentando.`);
    }

    this.flipped = [];
    this.locked = false;
    this.updateHud();

    if (this.matched.size === this.cards.length) {
      await this.finishMemory(true);
    } else if (this.errors >= 3) {
      await this.finishMemory(false);
    }
  }

  async finishMemory(completed) {
    this.locked = true;
    const matchedPairs = this.matched.size / 2;
    const multiplier = completed ? 5 : matchedPairs >= 5 ? 2 : matchedPairs >= 3 ? 1.3 : 0;
    const win = multiplier > 0;

    this.setStatus(completed
      ? '🏆 Todos os pares encontrados!'
      : `Fim de jogo. Pares encontrados: ${matchedPairs}/8.`);

    await this.finalize({
      completed,
      matchedPairs,
      errors: this.errors,
      win,
      multiplier
    });
  }

  updateHud() {
    const pairs = this.domLayer.querySelector('#memoryPairs');
    const errors = this.domLayer.querySelector('#memoryErrors');
    if (pairs) pairs.textContent = this.matched.size / 2;
    if (errors) errors.textContent = this.errors;
  }

  makeCards() {
    const cards = [...SYMBOLS, ...SYMBOLS];
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }
}
