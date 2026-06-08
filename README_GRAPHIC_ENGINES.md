# Blinders Studio — Graphic Engines Update

Atualização front-only que integra as imagens geradas ao projeto React e adiciona motores gráficos independentes.

## Assets implementados

- `public/assets/studio/backgrounds/casino-lobby.png`
- `public/assets/studio/backgrounds/casino-lounge.png`
- `public/assets/studio/backgrounds/control-room.png`
- `public/assets/studio/sheets/icon-sheet.png`
- `public/assets/studio/icons/*.png`

## Motores gráficos independentes

### ChakraParticleEngine
Arquivo: `src/engines/ChakraParticleEngine.ts`

Motor Canvas 2D isolado para partículas leves de chakra.

### PixiCasinoEngine
Arquivo: `src/engines/PixiCasinoEngine.ts`

Motor PixiJS/WebGL isolado para cenas 2D:
- lobby
- slots
- roulette
- blackjack

### ThreeShowcaseEngine
Arquivo: `src/engines/ThreeShowcaseEngine.ts`

Motor Three.js isolado para modelos 3D procedurais:
- mesa
- roleta
- fichas
- cartas
- cristal
- selo orbital

## Componentes criados

- `src/components/StudioCanvas.tsx`
- `src/components/PixiStage.tsx`
- `src/components/ThreeShowcase.tsx`
- `src/components/StudioShowcase.tsx`

## Observação

Supabase, SQL, Auth e regras do banco foram preservados.
