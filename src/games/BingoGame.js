import { BaseGame } from './BaseGame.js';
import { startGame } from '../api/games.js';
import { Performance } from '../core/Performance.js';
import { RuntimePerformance } from '../core/RuntimePerformance.js';

export class BingoGame extends BaseGame {
  constructor() {
    super({
      key: 'bingo',
      name: 'Bingo 100 Números',
      icon: '🔢',
      rules: 'Escolha de 3 até 10 números na cartela de 1 a 100. O sorteio puxa 1 número por vez, aleatório e sem repetir.',
      choices: [{ value: 'custom', label: 'Escolher números' }]
    });
    this.selected = new Set();
    this.drawn = new Set();
  }

  mount(root) {
    super.mount(root);
    this.injectPicker();
  }

  injectPicker() {
    const select = document.querySelector('#gameChoice');
    if (select) select.closest('label').style.display = 'none';

    const panel = document.querySelector('.game-side .panel');
    if (!panel || document.querySelector('#bingoPicker')) return;

    const box = document.createElement('div');
    box.id = 'bingoPicker';
    box.className = 'bingo-picker-box';
    box.innerHTML = `
      <h3>🔢 Escolha seus números</h3>
      <p>Escolha de <b>3 até 10 números</b>. O sorteio revela <b>1 número por vez</b>, aleatório e sem repetir.</p>
      <div class="bingo-selected" id="bingoSelected">Nenhum número escolhido.</div>
      <div class="bingo-picker-grid">
        ${Array.from({ length: 100 }, (_, i) => `<button type="button" data-n="${i + 1}">${i + 1}</button>`).join('')}
      </div>
      <button class="ghost" type="button" id="clearBingoNumbers">Limpar números</button>
    `;
    panel.insertBefore(box, panel.querySelector('.primary'));

    box.querySelectorAll('[data-n]').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = Number(btn.dataset.n);
        if (this.selected.has(n)) {
          this.selected.delete(n);
          btn.classList.remove('selected');
        } else {
          if (this.selected.size >= 10) return;
          this.selected.add(n);
          btn.classList.add('selected');
        }
        this.updateSelectedLabel();
        this.drawIdle();
      });
    });

    box.querySelector('#clearBingoNumbers')?.addEventListener('click', () => {
      this.selected.clear();
      box.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
      this.updateSelectedLabel();
      this.drawIdle();
    });
  }

  updateSelectedLabel() {
    const label = document.querySelector('#bingoSelected');
    const values = [...this.selected].sort((a, b) => a - b);
    if (label) label.textContent = values.length ? `Escolhidos: ${values.join(', ')}` : 'Nenhum número escolhido.';
  }

  async createSession() {
    if (this.selected.size < 3) throw new Error('Escolha pelo menos 3 números para jogar Bingo.');
    const bet = document.querySelector('#betAmount')?.value || '1B';
    const choice = [...this.selected].sort((a, b) => a - b).join(',');
    let data;
    try {
      data = await startGame(this.key, bet, choice);
    } catch (error) {
      if (String(error.message || '').includes('query returned more than one row')) {
        throw new Error('Bingo precisa do SQL V12 no Supabase. Rode BLINDERS_NETLIFY_V12_BINGO_FIX_PERFORMANCE.sql.');
      }
      throw error;
    }
    this.session = data.session;
    this.preview = data.preview || {};
    return data;
  }

  drawIdle() {
    this.drawPixiTable('bingo');
    this.text('BINGO', this.width()/2, this.height()/2 - 86, 52);
    this.pixiBingoBall('--', this.width()/2, this.height()/2 + 20, 62);

    const selected = this.selected;
    this.domLayer.innerHTML = `
      <div class="bingo-scene bingo-100">
        <h2 id="drawn">🔢 Escolha seus números e aposte</h2>
        <div class="bingo-last-ball" id="bingoLastBall">--</div>
        <div class="bingo-progress" id="bingoProgress">0/25 sorteados</div>
        <div class="bingo-grid bingo-grid-100">
          ${Array.from({ length: 100 }, (_, i) => {
            const n = i + 1;
            return `<div data-n="${n}" class="${selected.has(n) ? 'chosen' : ''}">${n}</div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  async animate() {
    await this.ready;
    this.drawIdle();
    this.drawn = new Set();

    const rawDrawn = Array.isArray(this.preview.drawn) ? this.preview.drawn : this.makeLocalDraw();
    const drawnQueue = this.uniqueQueue(rawDrawn).slice(0, 25);
    const selected = new Set(this.preview.selected || [...this.selected]);
    const hitNumbers = new Set();

    const label = this.domLayer.querySelector('#drawn');
    const ball = this.domLayer.querySelector('#bingoLastBall');
    const progress = this.domLayer.querySelector('#bingoProgress');
    const delay = RuntimePerformance.animationDelay(Performance.lowMode ? 190 : 320);

    this.setStatus('🔢 Sorteando um número por vez, sem repetição...');

    let pixiBall = null;
    let index = 0;
    for (const n of drawnQueue) {
      if (this.drawn.has(n)) continue;
      this.drawn.add(n);
      index += 1;

      if (selected.has(n)) hitNumbers.add(n);

      if (pixiBall) pixiBall.destroy();
      pixiBall = this.pixiBingoBall(n, this.width()/2, this.height()/2 + 20, 68);
      pixiBall.scale.set(0.35);
      await this.tween(pixiBall.scale, { x: 1, y: 1, duration: 0.18, ease: 'back.out(2.2)' });

      if (label) label.textContent = selected.has(n) ? `🎯 Acertou o número ${n}!` : `🎱 Número sorteado: ${n}`;
      if (ball) {
        ball.textContent = String(n).padStart(2, '0');
        ball.classList.remove('pop');
        void ball.offsetWidth;
        ball.classList.add('pop');
      }
      if (progress) progress.textContent = `${index}/25 sorteados`;

      this.domLayer.querySelectorAll(`[data-n="${n}"]`).forEach(el => {
        el.classList.add(selected.has(n) ? 'hit' : 'drawn');
      });

      if (selected.has(n)) this.particleBurst(this.width()/2, this.height()/2 + 20, 0x78e6a1, 22);
      await this.wait(delay);
    }

    const hits = hitNumbers.size;
    if (label) label.textContent = `✅ Sorteio finalizado — ${hits} acerto(s)`;
    await this.wait(500);

    await this.finalize({
      selected: [...selected].sort((a, b) => a - b),
      drawn: [...this.drawn],
      hitNumbers: [...hitNumbers].sort((a, b) => a - b),
      hits,
      matched: hits,
      oneByOne: true,
      noRepeat: true
    });
  }

  uniqueQueue(values) {
    const seen = new Set();
    const clean = [];
    for (const value of values) {
      const n = Number(value);
      if (Number.isInteger(n) && n >= 1 && n <= 100 && !seen.has(n)) {
        seen.add(n);
        clean.push(n);
      }
    }
    if (clean.length < 25) {
      for (const n of this.makeLocalDraw()) {
        if (!seen.has(n)) {
          seen.add(n);
          clean.push(n);
          if (clean.length >= 25) break;
        }
      }
    }
    return clean;
  }

  makeLocalDraw() {
    const nums = Array.from({ length: 100 }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    return nums.slice(0, 25);
  }
}
