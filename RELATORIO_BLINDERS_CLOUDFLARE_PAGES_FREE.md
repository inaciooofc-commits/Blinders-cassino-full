# Blinders Cassino — Cloudflare Pages Free Edition

Criada versão para não depender mais do Netlify.

## Foco

- Hospedar sem gastar no Cloudflare Pages.
- Manter Supabase Free como banco.
- Usar RPC direta com token/cargo.
- Não expor service_role.
- Manter PixiJS, PNGs, V13 Módulo de Comando, jogos, perfil, rankings, missões e eventos.

## Arquivos importantes

- `CLOUDFLARE_PAGES_README.md`
- `DEPLOY_GRATIS_CLOUDFLARE.md`
- `public/_redirects`
- `database/BLINDERS_NETLIFY_V13_MODULO_COMANDO.sql`

## Configuração Cloudflare Pages

Build command:

`npm run build`

Output directory:

`dist`

Variáveis:

`VITE_SUPABASE_URL`

`VITE_SUPABASE_ANON_KEY`

## Resultado

O site não precisa mais de créditos Netlify.
