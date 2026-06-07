# Blinders V14.4 — Reference Layout

## Objetivo

Fazer o site parecer com as imagens de referência enviadas, sem mexer no JavaScript estável e sem causar novos erros de build.

## Problema atual

O site estava abrindo, mas com visual branco/cinza, sem imagem forte e sem a renderização do dashboard casino.

## Estratégia segura

Este patch mexe apenas em CSS e assets PNG.

Não altera:

- `package.json`
- `vite.config.js`
- `src/main.js`
- `src/core/Router.js`

Assim o build continua usando a base estável e o risco de `UNRESOLVED_IMPORT` volta a ser mínimo.

## Incluído

- `src/styles/v14-anime-casino.css`
- `public/assets/v14/ref/dashboard-reference.png`
- `public/assets/v14/ref/style-board-reference.png`
- `public/assets/v14/crops/*.png`
- `public/assets/v14/cards/*.png`

## Visual aplicado

- Sidebar escura com assinatura Blinders.
- Top ticker igual painel de cassino.
- Hero central com imagem estilo anime/casino.
- Ranking semanal à direita.
- Atividade recente à direita.
- Jogos em destaque com cards visuais.
- Painéis inferiores de Banco IRIS, loja, depósito, saque e transferência.
- Tema preto, roxo, azul e dourado.
