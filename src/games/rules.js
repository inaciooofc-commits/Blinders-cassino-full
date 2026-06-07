const symbols = ['CRYSTAL', 'SEVEN', 'CROWN', 'CARD', 'VAULT', 'CHIP'];

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function playRoulette(bet, choice) {
  const number = randomInt(0, 36);
  const color = number === 0 ? 'green' : number % 2 ? 'red' : 'black';
  let win = false;
  let multiplier = 0;

  if (choice === color && number !== 0) { win = true; multiplier = 2; }
  else if (choice === 'even' && number !== 0 && number % 2 === 0) { win = true; multiplier = 2; }
  else if (choice === 'odd' && number % 2 === 1) { win = true; multiplier = 2; }
  else if (/^\d+$/.test(choice) && Number(choice) === number) { win = true; multiplier = 36; }

  return {
    title: 'Roulette',
    win,
    payout: win ? bet * multiplier : 0,
    multiplier,
    message: `Caiu ${number} ${color}. ${win ? `Pagamento ${multiplier}x.` : 'Sem prêmio.'}`,
    visual: { number, color }
  };
}

export function playDice(bet, choice) {
  const dice = [randomInt(1, 6), randomInt(1, 6)];
  const total = dice[0] + dice[1];
  let win = false;
  let multiplier = 0;

  if (choice === 'high' && total >= 8) { win = true; multiplier = 1.95; }
  else if (choice === 'low' && total <= 6) { win = true; multiplier = 1.95; }
  else if (choice === 'even' && total % 2 === 0) { win = true; multiplier = 1.95; }
  else if (choice === 'odd' && total % 2 === 1) { win = true; multiplier = 1.95; }
  else if (/^\d+$/.test(choice) && Number(choice) === total) { win = true; multiplier = total === 7 ? 6 : 8; }

  return {
    title: 'Dice',
    win,
    payout: win ? bet * multiplier : 0,
    multiplier,
    message: `Dados ${dice[0]} + ${dice[1]} = ${total}. ${win ? `Pagamento ${multiplier}x.` : 'Sem prêmio.'}`,
    visual: { dice, total }
  };
}

export function playSlots(bet) {
  const result = Array.from({ length: 9 }, () => symbols[randomInt(0, symbols.length - 1)]);
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,4,8],[2,4,6]];
  let multiplier = 0;
  let wins = 0;

  for (const line of lines) {
    const [a,b,c] = line.map(i => result[i]);
    if (a === b && b === c) {
      wins++;
      multiplier += a === 'SEVEN' ? 12 : a === 'CRYSTAL' ? 8 : a === 'CROWN' ? 6 : 4;
    }
  }

  if (wins === 0 && (result[3] === result[4] || result[4] === result[5] || result[3] === result[5])) {
    multiplier = 1.2;
  }

  return {
    title: 'Slots',
    win: multiplier > 0,
    payout: multiplier > 0 ? bet * multiplier : 0,
    multiplier,
    message: multiplier > 0 ? `${wins || 1} combinação. Pagamento ${multiplier}x.` : 'Nenhuma linha vencedora.',
    visual: { symbols: result }
  };
}

const deckFaces = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
export function drawCard() {
  return deckFaces[randomInt(0, deckFaces.length - 1)];
}

export function handValue(cards) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card === 'A') { total += 11; aces++; }
    else if (['J','Q','K'].includes(card)) total += 10;
    else total += Number(card);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

export function finishBlackjack(player, dealer, bet) {
  let playerTotal = handValue(player);
  let dealerTotal = handValue(dealer);

  while (dealerTotal < 17) {
    dealer.push(drawCard());
    dealerTotal = handValue(dealer);
  }

  const natural = player.length === 2 && playerTotal === 21;
  let win = false;
  let push = false;
  let multiplier = 0;

  if (natural) { win = true; multiplier = 2.5; }
  else if (playerTotal > 21) { win = false; }
  else if (dealerTotal > 21) { win = true; multiplier = 2; }
  else if (playerTotal > dealerTotal) { win = true; multiplier = 2; }
  else if (playerTotal === dealerTotal) { push = true; multiplier = 1; }

  return {
    title: 'Blackjack',
    win: win || push,
    payout: (win || push) ? bet * multiplier : 0,
    multiplier,
    message: `Você ${playerTotal} / Banca ${dealerTotal}. ${natural ? 'Blackjack natural 3:2.' : push ? 'Empate devolve.' : win ? 'Vitória.' : 'Banca venceu.'}`,
    visual: { player, dealer, playerTotal, dealerTotal }
  };
}

export function drawBingoNumbers(count = 25) {
  const pool = Array.from({ length: 100 }, (_, i) => i + 1);
  const drawn = [];
  while (drawn.length < count && pool.length) {
    const idx = randomInt(0, pool.length - 1);
    drawn.push(pool.splice(idx, 1)[0]);
  }
  return drawn;
}

export function scoreBingo(bet, picked, drawn) {
  const clean = picked.filter(n => Number.isInteger(n) && n >= 1 && n <= 100).slice(0, 10);
  const hits = clean.filter(n => drawn.includes(n)).length;
  const multiplier = hits >= 10 ? 25 : hits >= 8 ? 12 : hits >= 6 ? 5 : hits >= 4 ? 2.5 : hits >= 3 ? 1.5 : 0;
  return {
    title: 'Bingo',
    win: multiplier > 0,
    payout: multiplier > 0 ? bet * multiplier : 0,
    multiplier,
    message: `${hits} acertos. ${multiplier > 0 ? `Pagamento ${multiplier}x.` : 'Sem prêmio.'}`,
    visual: { picked: clean, drawn, hits }
  };
}

export function playMemory(bet) {
  const errors = randomInt(0, 5);
  const pairs = randomInt(3, 8);
  const multiplier = errors <= 3 ? Math.max(1.2, pairs / 2) : 0;
  return {
    title: 'Memory',
    win: multiplier > 0,
    payout: multiplier > 0 ? bet * multiplier : 0,
    multiplier,
    message: `${pairs} pares e ${errors} erros. ${multiplier > 0 ? `Pagamento ${multiplier.toFixed(2)}x.` : 'Erros acima do limite.'}`,
    visual: { pairs, errors }
  };
}

export function playCrash(bet, cashoutTarget = null) {
  const crash = +(1.05 + Math.random() * 7).toFixed(2);
  const cashout = Number(cashoutTarget || (1.2 + Math.random() * 3).toFixed(2));
  const win = cashout < crash;
  return {
    title: 'Crash',
    win,
    payout: win ? bet * cashout : 0,
    multiplier: win ? cashout : 0,
    message: `Cashout ${cashout}x / Crash ${crash}x. ${win ? 'Retirada a tempo.' : 'Caiu antes.'}`,
    visual: { crash, multiplier: cashout }
  };
}

export function playPoker(bet) {
  const score = randomInt(1, 100);
  const multiplier = score > 95 ? 10 : score > 84 ? 4 : score > 68 ? 2 : 0;
  return {
    title: 'Poker',
    win: multiplier > 0,
    payout: multiplier > 0 ? bet * multiplier : 0,
    multiplier,
    message: multiplier > 0 ? `Mão vencedora. Pagamento ${multiplier}x.` : 'Mão sem prêmio.',
    visual: { score, cards: [drawCard(), drawCard(), drawCard(), drawCard(), drawCard()] }
  };
}
