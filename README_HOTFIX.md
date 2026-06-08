# Blinders React/Supabase Hotfix

Corrige:

1. TypeScript:
   - `src/hooks/useProfile.ts(49,7): error TS18047: 'supabase' is possibly 'null'`

2. Supabase:
   - `ERROR: 42710: policy ... already exists`
   - `ERROR: 42P01: relation "public.bets" does not exist`

## Aplicação

Substitua no projeto:

- `src/hooks/useProfile.ts`
- `supabase/schema.sql`

No Supabase SQL Editor, rode:

- `BLINDERS_SUPABASE_SCHEMA_V3_SUPER_SAFE.sql`

Resultado esperado:

```text
BLINDERS_SUPABASE_SCHEMA_V3_SUPER_SAFE_OK
```
