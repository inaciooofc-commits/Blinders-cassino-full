# Blinders Cassino — V10 PNG Layout + Blackjack Fix

## Erro do PDF corrigido

No PDF, o Blackjack mostrou:
- Você: 21
- Resultado: Perdeu

Isso estava errado. A V10 corrige no frontend e no Supabase:
- Se o jogador atinge 21, vence automaticamente.
- Blackjack natural com 2 cartas paga 2.5x.
- 21 com mais cartas paga 2x.
- Se parar antes de 21, vence quem ficar mais perto de 21 sem estourar.
- Empate devolve aposta.

## PNG em todo o site

Foram colocadas PNGs reais em:

- fundos do lobby;
- fundo do admin;
- fundo dos jogos;
- vitrine estilo Steam;
- cards de jogos;
- botões/cards do menu;
- ícones principais;
- mesas/cenas de jogo;
- cartas e molduras visuais.

## Arquivos criados

- `public/assets/png/backgrounds`
- `public/assets/png/games`
- `public/assets/png/icons`
- `public/assets/png/showcase`
- `public/assets/png/png-manifest.json`
- `src/core/PngAssets.js`
- `src/styles/png-skin.css`

## Visual

A V10 também força tema escuro para corrigir a tela branca/lavada vista no PDF, mantendo o estilo preto, dourado, premium e cassino.

## Resultado SQL esperado

`BLINDERS_NETLIFY_V10_PNG_LAYOUT_BLACKJACK_FIX_OK`
