# Blinders V14.3 — Visual Restore

## Problema observado no PDF

O site abriu, mas está visualmente fraco: fundo branco/cinza, sem imagens, sem cards renderizados e com layout simplificado.

No PDF, a página 1 mostra o menu lateral e o conteúdo do Blackjack sem imagens de fundo nem cards visuais.
A página 2 mostra cards brancos e sem mesa/cenário visual.
A página 3 mostra a área de aposta simples, também sem ambientação visual.

## Causa

A V14.2 foi um patch de emergência para estabilizar o build. Ela removeu imports quebráveis e deixou o Router autocontido, mas também ficou sem puxar os assets PNG avançados.

## Correção V14.3

- Mantém o build estável.
- Não adiciona imports externos no Router.
- Adiciona imagens PNG em `public/assets/v14`.
- Atualiza `src/styles/v14-anime-casino.css`.
- Atualiza `src/core/Router.js` para usar classes compatíveis com os novos cards.
- Restaura background cyber/anime, cards de jogos, ícones e visual de mesas.

## Arquivos incluídos

- `src/core/Router.js`
- `src/styles/v14-anime-casino.css`
- `public/assets/v14/bg/*.png`
- `public/assets/v14/games/*.png`
- `public/assets/v14/icons/*.png`

## Como aplicar

Extraia o ZIP e suba o conteúdo na raiz do repositório.
