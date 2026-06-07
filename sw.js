CORREÇÃO V14.2 — BUILD ESTÁVEL

Esta correção evita todos os erros de "Could not resolve" causados por imports de arquivos que não chegaram ao GitHub.

Arquivos principais substituídos:
- src/main.js
- src/core/Router.js
- src/styles/*.css
- vite.config.js
- package.json
- scripts/create-spa-fallback.cjs
- public/sw.js

Como aplicar:
1. Extraia este ZIP.
2. Suba o conteúdo extraído na raiz do repositório.
3. Substitua arquivos existentes quando o GitHub perguntar.
4. Commit changes.
5. Rode novo deploy no Cloudflare Pages.

Cloudflare:
Framework: Vite
Build command: npm run build
Output directory: dist

Depois que o site estiver abrindo, dá para reintroduzir recursos avançados aos poucos.
