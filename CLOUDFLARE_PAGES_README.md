# Blinders Cassino — Cloudflare Pages Free Edition

Esta versão foi adaptada para rodar sem Netlify.

## Hospedagem grátis recomendada

- Cloudflare Pages para o site
- Supabase Free para banco/RPC/login
- GitHub como repositório

## Configuração no Cloudflare Pages

Framework preset: Vite

Build command:

```bash
npm run build
```

Build output directory:

```bash
dist
```

## Variáveis de ambiente no Cloudflare Pages

Use as mesmas do projeto:

```env
VITE_SUPABASE_URL=https://lbmmqfgcyimijaqnvvpx.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

Não coloque service_role no frontend.

## Banco

Rode no Supabase:

```sql
BLINDERS_NETLIFY_V13_MODULO_COMANDO.sql
```

## O que mudou

- Removida dependência obrigatória de `/.netlify/functions`.
- Admin usa Supabase RPC direta com token/cargo.
- Mantém PixiJS, PNGs, jogos, menu admin, perfil, rankings, missões e eventos.
- Adicionado `_redirects` válido para SPA no Cloudflare Pages: `/* /index.html 200`.
