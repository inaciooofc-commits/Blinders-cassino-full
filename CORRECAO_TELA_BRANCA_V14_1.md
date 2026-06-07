# Correção tela branca — V14.1

## Causa provável

A tela branca pode ser causada por:

1. Service Worker/cache antigo segurando arquivos quebrados.
2. Cloudflare sem fallback SPA para rotas como `/menu`, `/admin/command` e `/bank`.
3. Erro de rota escondido sem tela de diagnóstico.
4. `vite.config.js` sem `plugins: []`.

## O que a V14.1 corrigiu

- Limpa caches antigos.
- Desregistra Service Workers antigos.
- Cria `dist/404.html` automaticamente para fallback SPA no Cloudflare.
- Mantém o projeto sem `_redirects` e sem `_headers`.
- Corrige `vite.config.js` com `plugins: []`.
- Cria tela de erro visível em vez de tela branca.
- Atualiza o preloader para assets V14.

## Cloudflare Pages

Use:

Framework: Vite

Build command:

npm run build

Output directory:

dist

## Depois de subir

No navegador, faça:

1. Abra o site.
2. Aperte Ctrl + F5.
3. Se ainda ficar branco, limpe dados do site/cache do navegador.
4. Teste `/`, `/menu`, `/games` e `/bank`.
