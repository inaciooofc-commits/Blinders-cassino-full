import { BaseGame } from './BaseGame.js';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

export class BlackjackGame extends BaseGame {
  constructor() {
    super({
      key: 'blackjack',
      name: 'Blackjack Real',
      icon: '🃏',
      rules: 'Você recebe 2 cartas. Se atingir 21 ganha na hora. Se parar antes de 21, vence quem chegar mais perto de 21 sem estourar.',
      choices: [{ value: 'manual', label: 'Manual: pedir/parar' }]
    });
    this.deck = [];
    this.player = [];
    this.dealer = [];
    this.finished = false;
  }

  mount(root) {
    super.mount(root);
    const special = document.querySelector('#specialBtn');
    if (special) special.style.display = 'none';
  }

  drawIdle() {
    this.drawPixiTable('blackjack');
    this.domLayer.innerHTML = `
      <div class="blackjack-table interactive-blackjack png-table">
        <section>
          <h2>🤵 Banca <small id="dealerTotal">?</small></h2>
          <div class="hand" id="cpuHand"></div>
        </section>
        <section>
          <h2>🧑 Você <small id="playerTotal">0</small></h2>
          <div class="hand" id="playerHand"></div>
        </section>
        <div class="blackjack-actions">
          <button class="primary" type="button" id="hitBtn">🃏 Pedir carta</button>
          <button class="ghost" type="button" id="standBtn">✋ Parar</button>
        </div>
      </div>
    `;
    this.toggleActionButtons(false);
  }

  async animate() {
    await this.ready;
    this.finished = false;
    this.deck = this.buildDeck(this.preview.deck);
    this.player = this.preview.playerCards?.length ? [...this.preview.playerCards] : [this.draw(), this.draw()];
    this.dealer = this.preview.dealerCards?.length ? [...this.preview.dealerCards] : [this.draw(), this.draw()];

    this.drawIdle();
    this.toggleActionButtons(true);
    this.renderHands(false);
    await this.dealPixiCards(false);

    const total = handTotal(this.player);
    if (total === 21) {
      this.setStatus('🏆 Você atingiu 21. Vitória automática!');
      this.particleBurst(this.width()/2, this.height()/2, 0x78e6a1, 44);
      await this.wait(650);
      await this.finishRound('twenty_one');
      return;
    }

    this.setStatus(`🃏 Sua mão tem ${total}. Escolha pedir carta ou parar.`);
    document.querySelector('#hitBtn')?.addEventListener('click', () => this.hit());
    document.querySelector('#standBtn')?.addEventListener('click', () => this.stand());
  }

  async hit() {
    if (this.finished) return;
    this.player.push(this.draw());
    this.renderHands(false);
    await this.dealPixiCards(false);

    const total = handTotal(this.player);
    if (total === 21) {
      this.setStatus('🏆 Você atingiu 21. Vitória automática!');
      this.particleBurst(this.width()/2, this.height()/2, 0x78e6a1, 44);
      await this.wait(650);
      await this.finishRound('twenty_one');
      return;
    }

    if (total > 21) {
      this.setStatus(`💥 Você estourou com ${total}.`);
      this.particleBurst(this.width()/2, this.height()/2, 0xff8c9a, 24);
      await this.wait(500);
      await this.finishRound('bust');
      return;
    }

    this.setStatus(`🃏 Sua mão tem ${total}. Você ainda pode pedir carta ou parar.`);
  }

  async stand() {
    if (this.finished) return;
    this.setStatus('✋ Você parou. A banca joga e vence quem ficar mais perto de 21.');
    this.renderHands(true);
    await this.dealPixiCards(true);

    while (handTotal(this.dealer) < 17) {
      await this.wait(520);
      this.dealer.push(this.draw());
      this.renderHands(true);
      await this.dealPixiCards(true);
    }

    await this.wait(350);
    await this.finishRound('stand');
  }

  async dealPixiCards(showDealer = false) {
    this.drawPixiTable('blackjack');
    const w = this.width();
    const h = this.height();
    this.text(`Banca ${showDealer ? handTotal(this.dealer) : '?'}`, w/2, h*.25, 28);
    this.text(`Você ${handTotal(this.player)}`, w/2, h*.62, 28);

    const dealerStart = w/2 - (this.dealer.length - 1) * 48;
    this.dealer.forEach((card, i) => {
      const faceUp = showDealer || i === 0;
      const c = this.pixiCard(card, dealerStart + i * 96, h*.36, faceUp);
      c.alpha = 0;
      c.y -= 30;
      this.tween(c, { alpha: 1, y: h*.36, duration: .18 + i*.04, ease: 'power2.out' });
    });

    const playerStart = w/2 - (this.player.length - 1) * 48;
    this.player.forEach((card, i) => {
      const c = this.pixiCard(card, playerStart + i * 96, h*.73, true);
      c.alpha = 0;
      c.y -= 30;
      this.tween(c, { alpha: 1, y: h*.73, duration: .18 + i*.04, ease: 'power2.out' });
    });
  }

  async finishRound(action) {
    if (this.finished) return;
    this.finished = true;
    this.toggleActionButtons(false);
    this.renderHands(true);
    await this.dealPixiCards(true);

    const playerTotal = handTotal(this.player);
    const dealerTotal = handTotal(this.dealer);

    let win = false;
    let push = false;
    let multiplier = 0;
    let reason = '';

    if (playerTotal === 21) {
      win = true;
      multiplier = this.player.length === 2 ? 2.5 : 2;
      reason = this.player.length === 2 ? 'Blackjack natural: 21 com 2 cartas.' : 'Você atingiu 21.';
    } else if (playerTotal > 21) {
      win = false;
      reason = 'Você estourou.';
    } else if (dealerTotal > 21) {
      win = true;
      multiplier = 2;
      reason = 'A banca estourou.';
    } else {
      const playerDistance = 21 - playerTotal;
      const dealerDistance = 21 - dealerTotal;
      if (playerDistance < dealerDistance) {
        win = true;
        multiplier = 2;
        reason = 'Você ficou mais perto de 21.';
      } else if (playerDistance === dealerDistance) {
        push = true;
        win = true;
        multiplier = 1;
        reason = 'Empate: aposta devolvida.';
      } else {
        win = false;
        reason = 'A banca ficou mais perto de 21.';
      }
    }

    this.setStatus(`${win ? '✅ Vitória' : '❌ Derrota'} — ${reason}<br>Você: ${playerTotal} · Banca: ${dealerTotal}`);
    this.particleBurst(this.width()/2, this.height()/2, win ? 0x78e6a1 : 0xff8c9a, win ? 38 : 18);

    await this.finalize({
      action,
      playerCards: this.player,
      dealerCards: this.dealer,
      playerTotal,
      dealerTotal,
      win,
      push,
      multiplier,
      reason,
      forceClientResult: true
    });
  }

  renderHands(showDealer = false) {
    const playerHand = this.domLayer.querySelector('#playerHand');
    const dealerHand = this.domLayer.querySelector('#cpuHand');
    const playerTotal = this.domLayer.querySelector('#playerTotal');
    const dealerTotal = this.domLayer.querySelector('#dealerTotal');

    if (playerHand) playerHand.innerHTML = this.player.map(cardHtml).join('');
    if (dealerHand) {
      dealerHand.innerHTML = this.dealer.map((card, index) => {
        if (index === 1 && !showDealer) return `<div class="playing-card card-back">?</div>`;
        return cardHtml(card);
      }).join('');
    }
    if (playerTotal) playerTotal.textContent = handTotal(this.player);
    if (dealerTotal) dealerTotal.textContent = showDealer ? handTotal(this.dealer) : '?';
  }

  toggleActionButtons(enabled) {
    this.domLayer.querySelectorAll('#hitBtn,#standBtn').forEach(btn => {
      btn.disabled = !enabled;
      btn.classList.toggle('disabled', !enabled);
    });
  }

  buildDeck(serverDeck) {
    if (Array.isArray(serverDeck) && serverDeck.length) return [...serverDeck];
    const cards = [];
    for (const suit of SUITS) for (const rank of RANKS) cards.push(rank + suit);
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }

  draw() {
    return this.deck.shift() || 'A♠';
  }
}

function cardHtml(card) {
  const red = /[♥♦]/.test(card) ? ' red' : '';
  return `<div class="playing-card${red}">${card}</div>`;
}

function handTotal(cards) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    const rank = String(card).replace(/[♠♥♦♣]/g, '');
    if (rank === 'A') { total += 11; aces += 1; }
    else if (['J','Q','K'].includes(rank)) total += 10;
    else total += Number(rank) || 0;
  }
  while (total > 21 && aces > 0) { total -= 10; aces -= 1; }
  return total;
}
