# Blinders Cassino — V5 Admin Supabase Fix

## Problema corrigido

Erro informado: **Supabase não configurado no Netlify**.

A causa era que as Netlify Functions dependiam de variáveis do Netlify. Agora elas possuem fallback público seguro para:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

A `service_role` continua **fora do frontend** e **não é necessária** para as ações corrigidas.

## Segurança

As ações admin continuam protegidas porque:

- usam token de sessão;
- a RPC `v25_current` valida sessão;
- a RPC `app_assert_admin` exige cargo `admin` ou `owner`;
- tudo é registrado em `admin_audit_logs`;
- `service_role` não é exposta ao navegador.

## Corrigido no projeto

- `_supabase.cjs` não trava mais com “Supabase não configurado”.
- `secure-action` usa anon + RPC segura.
- `confirm-deposit` usa anon + RPC segura.
- `confirm-withdraw` usa anon + RPC segura.
- Admin Center tem fallback direto por RPC se a Function falhar.
- Mensagens de erro aparecem na tela.
- Ação principal volta a executar.

## Ordem

1. Rode o SQL V5 no Supabase.
2. Suba o ZIP V5 no Netlify Build.
3. Teste:
   - `/admin/deposits`
   - `/admin/withdraws`
   - `/admin/settings`
   - `/.netlify/functions/health`

## Resultado SQL esperado

`BLINDERS_NETLIFY_EVOLUTION_FULL_V5_ADMIN_SUPABASE_FIX_OK`
