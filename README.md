# Blinders Casino — Ninja Studio React

Website SPA completo com estética anime ninja/cassino original, inspirado em shonen, sem usar assets oficiais protegidos.

## Stack
- Vite + React + TypeScript
- Tailwind CSS v4 via `@tailwindcss/vite`
- Supabase Auth, Database e Realtime
- PixiJS para slot machine
- GSAP para animações dos reels
- Framer Motion para UI
- Cloudflare Pages

## Funcionalidades
- Auth por email/senha e Google via Supabase
- Modo demo quando Supabase não está configurado
- Perfil com saldo, energia e VIP
- Dashboard com histórico de apostas
- Slots PixiJS com reels girando e detecção de vitória
- Blackjack funcional
- Roulette funcional
- Jogos rápidos para Poker/Dice
- Loja, VIP e Eventos
- Realtime preparado para saldo e apostas

## Rodar local
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Cloudflare Pages
Build command:
```bash
npm run build
```

Output directory:
```bash
dist
```

Variáveis:
```bash
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Supabase
Rode `supabase/schema.sql` no SQL Editor.

## Observação de copyright
O projeto usa estética original anime ninja/cassino. Não inclui personagens, marcas, músicas, imagens, nomes ou trilhas oficiais de Naruto.
