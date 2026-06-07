# Blinders Cassino — V14.1 Hotfix Tela Branca

## Corrigido

- Limpeza automática de Service Worker antigo.
- Limpeza automática de caches antigos.
- `vite.config.js` corrigido com `plugins: []`.
- Build agora gera `dist/404.html` para fallback SPA no Cloudflare.
- Projeto continua sem `_redirects` e sem `_headers`.
- Tela branca substituída por tela de erro visível.
- Router protegido com `try/catch`.
- Preloader atualizado para assets V14.
- Correção de `GamePage` quando `meta.icon` não existe.
- Build validado localmente.

## Cloudflare Pages

Use:

`Framework: Vite`

`Build command: npm run build`

`Output directory: dist`

## Validação local

- JS syntax errors: `0`
- Build OK: `True`
- `dist/404.html`: `True`
- Arquivos proibidos encontrados: `[]`

## Depois de subir

Acesse o site e use `Ctrl + F5`.

Se ainda aparecer branco no mesmo navegador, limpe os dados do site porque pode haver Service Worker antigo preso.
