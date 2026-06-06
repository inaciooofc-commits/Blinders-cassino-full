# Blinders Cassino — V13 Módulo de Comando

## Implementado

- Módulo de Comando admin em `/admin/command`.
- Diagnóstico do Supabase.
- Auto-repair seguro do banco.
- Malena oculta: eventos internos, sugestões e saúde do sistema.
- Perfil do membro em `/profile`.
- Rankings em `/rankings`.
- Missões em `/missions`.
- Eventos em `/events`.
- Loja visual atualizada em `/shop`.
- Bônus com RPC real `app_bonus_redeem`.
- Admin Center reorganizado com área de comando no topo.
- Menu principal atualizado com Perfil, Missões, Eventos e Rankings.

## Segurança

- O auto-repair exige sessão admin/dono.
- Diagnóstico admin exige sessão admin/dono.
- Malena continua oculta para membros comuns.
- Ações continuam registradas em `admin_audit_logs`.
- Nenhuma service_role foi exposta no frontend.

## SQL principal

Resultado esperado:

`BLINDERS_NETLIFY_V13_MODULO_COMANDO_OK`

## Rotas novas

- `/admin/command`
- `/profile`
- `/rankings`
- `/missions`
- `/events`
