# BLINDERS V4.1 — Force Layout Deploy

Este hotfix corrige o caso em que o deploy sobe, mas o layout novo não aparece.

## Causas comuns corrigidas

1. Service Worker/cache antigo prendendo a versão anterior.
2. Cache do navegador/Cloudflare servindo index antigo.
3. Assets PNG sem cache-bust.
4. Usuário aplicou apenas hotfix pequeno sem aplicar o patch visual completo.
5. Falta de fallback SPA no Cloudflare Pages.

## O que foi adicionado

- Reset automático de Service Workers antigos.
- Limpeza de caches antigos chamados Blinders/Vite/Casino.
- `_headers` com `no-cache` para `/` e `/index.html`.
- `_redirects` com fallback SPA.
- Versionamento dos assets com `?v=4.1.0`.
- Badge visível no site: `BLINDERS GRAPHIC ENGINES 4.1.0`.
- Classe `v4-force-layout` forçando background novo na aplicação.

## Como confirmar

Depois do deploy, procure no canto inferior direito:

```text
BLINDERS GRAPHIC ENGINES
4.1.0
```

Se não aparecer, o deploy ainda está usando arquivos antigos.
