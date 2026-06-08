# Hotfix TS1005 — Graphic Engines V4

Corrige o erro:

```text
src/games/BlackjackGame.tsx(72,184): error TS1005: ':' expected.
src/games/RouletteGame.tsx(31,185): error TS1005: ':' expected.
src/games/SlotMachine.tsx(146,184): error TS1005: ':' expected.
```

## Causa

O background foi escrito assim:

```tsx
url(${{'studioAssets.backgrounds.lounge'}})
```

Isso é inválido em TypeScript/TSX.

## Correção

Agora está assim:

```tsx
url(${studioAssets.backgrounds.lounge})
```

## Aplicação

Substitua estes arquivos:

- `src/games/BlackjackGame.tsx`
- `src/games/RouletteGame.tsx`
- `src/games/SlotMachine.tsx`

Depois rode:

```bash
npm run build
```
