# Blinders Cassino — Versão Final

Projeto Vite pronto para Cloudflare Pages, com visual cyber/anime, Banco IRIS, jogos, loja, missões, eventos, painel admin e Supabase SQL via RPC.

## Deploy Cloudflare

Framework: Vite  
Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

## Variáveis de ambiente

Configure no Cloudflare Pages:

```text
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

Não use `service_role` no frontend.

## Supabase

Cole o arquivo abaixo no Supabase SQL Editor:

```text
database/BLINDERS_FINAL_SQL.sql
```

Resultado esperado:

```text
BLINDERS_FINAL_SQL_OK
```

## Segurança

- RLS ativado.
- Tabelas sensíveis sem escrita direta para anon/authenticated.
- Ações passam por RPC SECURITY DEFINER.
- Frontend usa apenas anon key.
