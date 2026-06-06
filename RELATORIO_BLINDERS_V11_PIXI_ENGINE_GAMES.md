# Blinders Cassino — V11 Pixi Engine Games

## Erro corrigido

- Corrigido `PIXI is not defined`.
- O PixiJS agora é importado de forma explícita em `BaseGame.js`.
- `globalThis.PIXI = PIXI` é definido por compatibilidade.
- O jogo Crash não depende mais de uma variável global solta.
- O botão de jogar aguarda `this.ready` antes de iniciar a animação.

## Motor Pixi centralizado

`BaseGame.js` agora possui helpers:

- `drawPixiTable`
- `pixiPanel`
- `pixiText`
- `pixiCard`
- `pixiDie`
- `pixiBingoBall`
- `particleBurst`
- `clearPixi`
- `addTicker`
- `removeTicker`

## Jogos com Pixi

- Crash: gráfico, foguete, rastro e partículas.
- Roleta: roda Pixi, bolinha e número vencedor.
- Slots: rolos Pixi com parada em sequência.
- Blackjack: cartas Pixi, pedir/parar, 21 automático.
- Dados: dados Pixi com pips reais.
- Bingo: bola Pixi sorteada uma por uma.
- Cara ou Coroa: moeda Pixi girando.
- Raspadinha: efeitos Pixi e partículas.
- Memória: mesa Pixi e efeitos ao acertar/errar pares.

## Resultado SQL esperado

`BLINDERS_NETLIFY_V11_PIXI_ENGINE_GAMES_OK`
