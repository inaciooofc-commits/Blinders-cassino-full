# SQL NOTES — BLINDERS V5

A V5 é front-only.

## Não alterado
- Nenhuma tabela.
- Nenhuma RPC.
- Nenhuma função SQL.
- Nenhuma regra do Supabase.
- Nenhum nome de banco.
- Nenhum endpoint SQL.

## SQL recomendado
Continue usando os SQLs anteriores já aplicados:

1. BLINDERS_RELEASE_LAUNCH_SQL_V2_FUNCTION_DROP.sql
2. BLINDERS_RELEASE_V4_AUTH_PWA_SQL.sql

A V5 apenas consome as funções existentes pelo frontend.

## Segurança
- Não usar service_role no frontend.
- Continuar usando VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
- Ações reais continuam bloqueadas se o Banco IRIS não conectar.
