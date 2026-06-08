# Blinders Cassino — Release Launch

Versão principal de lançamento.

## Aplicar
1. Rode `database/BLINDERS_RELEASE_LAUNCH_SQL.sql` no Supabase.
2. Configure Cloudflare Pages:
   - Build command: `npm run build`
   - Output: `dist`
3. Configure:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Dinheiro antigo
O banco armazena em unidade B:
- 1 = 1b
- 10 = 10b
- 100 = 100b
- 1000 = 1T

## SQL only mode
Se o Banco IRIS não conectar, jogos/banco/loja/admin ficam bloqueados.
