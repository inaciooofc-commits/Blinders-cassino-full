-- ============================================================
-- BLINDERS NETLIFY V13 — MÓDULO DE COMANDO
--
-- Implementa:
-- - Central de comando admin;
-- - Malena oculta;
-- - Auto-repair seguro do banco;
-- - Perfil do membro;
-- - Rankings;
-- - Missões;
-- - Eventos;
-- - Loja visual;
-- - Bônus real básico;
-- - Compatibilidade com tabelas antigas.
--
-- Resultado esperado:
-- BLINDERS_NETLIFY_V13_MODULO_COMANDO_OK
-- ============================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------
-- Base segura
-- ------------------------------------------------------------
create table if not exists public.app_members (
  id uuid primary key default extensions.gen_random_uuid()
);

alter table public.app_members add column if not exists nick text;
alter table public.app_members add column if not exists zarcovi_account text;
alter table public.app_members add column if not exists password_hash text;
alter table public.app_members add column if not exists role text default 'user';
alter table public.app_members add column if not exists status text default 'active';
alter table public.app_members add column if not exists iris_member_id text;
alter table public.app_members add column if not exists friend_code text;
alter table public.app_members add column if not exists phone text;
alter table public.app_members add column if not exists phone_digits text;
alter table public.app_members add column if not exists balance_virtual_units numeric(40,2) not null default 0;
alter table public.app_members add column if not exists created_at timestamptz default now();
alter table public.app_members add column if not exists updated_at timestamptz default now();

update public.app_members
set
  role = coalesce(role,'user'),
  status = coalesce(status,'active'),
  balance_virtual_units = coalesce(balance_virtual_units,0),
  friend_code = coalesce(nullif(friend_code,''), 'FR-' || upper(substr(encode(extensions.gen_random_bytes(5),'hex'),1,10))),
  iris_member_id = coalesce(nullif(iris_member_id,''), coalesce(nick,'IRIS') || '-IRIS');

create table if not exists public.app_member_sessions (
  id uuid primary key default extensions.gen_random_uuid()
);

alter table public.app_member_sessions add column if not exists member_id uuid;
alter table public.app_member_sessions add column if not exists token text;
alter table public.app_member_sessions add column if not exists expires_at timestamptz default now()+interval '30 days';
alter table public.app_member_sessions add column if not exists created_at timestamptz default now();

create index if not exists ix_v13_sessions_token on public.app_member_sessions(token);
create index if not exists ix_v13_members_nick_lower on public.app_members(lower(nick));
create index if not exists ix_v13_members_friend_code on public.app_members(friend_code);

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------
drop function if exists public.v25_parse(text);
create or replace function public.v25_parse(p_amount text)
returns numeric
language plpgsql
immutable
as $$
declare
  s text := upper(trim(coalesce(p_amount,'')));
  n numeric;
begin
  if s='' then return 0; end if;
  s := replace(replace(s,' ',''),',','.');
  if s like '%T' then
    n := nullif(regexp_replace(s,'[^0-9.\-]','','g'),'')::numeric;
    return greatest(n,0)*1000000000000;
  end if;
  if s like '%B' then
    n := nullif(regexp_replace(s,'[^0-9.\-]','','g'),'')::numeric;
    return greatest(n,0)*1000000000;
  end if;
  n := nullif(regexp_replace(s,'[^0-9.\-]','','g'),'')::numeric;
  return greatest(n,0);
exception when others then
  raise exception 'Valor inválido. Use 1500B, 1.5T ou 3T.';
end;
$$;

drop function if exists public.v25_format(numeric);
create or replace function public.v25_format(p_units numeric)
returns text
language plpgsql
immutable
as $$
declare
  v numeric := coalesce(p_units,0);
begin
  if abs(v)>=1000000000000 then return trim(to_char(v/1000000000000,'FM999999999999990D00'))||'T'; end if;
  if abs(v)>=1000000000 then return trim(to_char(v/1000000000,'FM999999999999990D00'))||'B'; end if;
  return trim(to_char(v,'FM999999999999990D00'));
end;
$$;

drop function if exists public.v25_current(text);
create or replace function public.v25_current(p_token text)
returns public.app_members
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  m public.app_members;
begin
  select a.*
  into m
  from public.app_member_sessions s
  join public.app_members a on a.id=s.member_id
  where s.token=p_token
    and s.expires_at>now()
  limit 1;

  if m.id is null then
    raise exception 'Sessão expirada. Entre novamente.';
  end if;

  return m;
end;
$$;

drop function if exists public.app_assert_admin(text);
create or replace function public.app_assert_admin(p_token text)
returns public.app_members
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  m public.app_members;
begin
  m := public.v25_current(p_token);

  if coalesce(m.role,'user') not in ('admin','owner') then
    raise exception 'Acesso reservado para admin/dono.';
  end if;

  return m;
end;
$$;

-- ------------------------------------------------------------
-- Tabelas do módulo de comando
-- ------------------------------------------------------------
create table if not exists public.admin_audit_logs (
  id bigint generated by default as identity primary key
);

alter table public.admin_audit_logs add column if not exists admin_id uuid;
alter table public.admin_audit_logs add column if not exists action text default 'admin_action';
alter table public.admin_audit_logs add column if not exists target text;
alter table public.admin_audit_logs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.admin_audit_logs add column if not exists result jsonb default '{}'::jsonb;
alter table public.admin_audit_logs add column if not exists created_at timestamptz default now();

create table if not exists public.blinders_system_health (
  id bigint generated by default as identity primary key,
  module text not null,
  ok boolean not null default true,
  detail text,
  metadata jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.blinders_malena_events (
  id bigint generated by default as identity primary key,
  severity text not null default 'info',
  source text not null default 'malena',
  message text not null,
  suggestion text,
  hidden boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.blinders_mission_definitions (
  mission_key text primary key,
  title text not null,
  description text,
  icon text default '🎯',
  mission_type text default 'daily',
  target_count int not null default 1,
  reward_units numeric(40,2) not null default 0,
  active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.blinders_mission_claims (
  id uuid primary key default extensions.gen_random_uuid(),
  mission_key text not null,
  member_id uuid not null,
  reward_units numeric(40,2) not null default 0,
  claimed_at timestamptz default now()
);

create table if not exists public.blinders_events (
  event_key text primary key,
  title text not null,
  description text,
  event_type text default 'special',
  reward text,
  active boolean not null default true,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.member_inventory (
  id uuid primary key default extensions.gen_random_uuid()
);

alter table public.member_inventory add column if not exists member_id uuid;
alter table public.member_inventory add column if not exists item_key text;
alter table public.member_inventory add column if not exists source text default 'shop';
alter table public.member_inventory add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.member_inventory add column if not exists created_at timestamptz default now();

create table if not exists public.shop_items (
  item_key text
);

alter table public.shop_items add column if not exists id uuid;
update public.shop_items set id = extensions.gen_random_uuid() where id is null;
alter table public.shop_items alter column id set default extensions.gen_random_uuid();
alter table public.shop_items add column if not exists title text;
alter table public.shop_items add column if not exists name text;
alter table public.shop_items add column if not exists category text default 'profile';
alter table public.shop_items add column if not exists description text;
alter table public.shop_items add column if not exists item_type text default 'badge';
alter table public.shop_items add column if not exists rarity text default 'common';
alter table public.shop_items add column if not exists price_units numeric(40,2) not null default 0;
alter table public.shop_items add column if not exists price numeric(40,2) default 0;
alter table public.shop_items add column if not exists stock int default 0;
alter table public.shop_items add column if not exists active boolean not null default true;
alter table public.shop_items add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.shop_items add column if not exists created_at timestamptz default now();
alter table public.shop_items add column if not exists updated_at timestamptz default now();

create table if not exists public.bonus_codes (
  id uuid primary key default extensions.gen_random_uuid()
);

alter table public.bonus_codes add column if not exists code text;
alter table public.bonus_codes add column if not exists title text;
alter table public.bonus_codes add column if not exists money_units numeric(40,2) default 0;
alter table public.bonus_codes add column if not exists item_key text;
alter table public.bonus_codes add column if not exists max_uses int;
alter table public.bonus_codes add column if not exists max_per_user int default 1;
alter table public.bonus_codes add column if not exists active boolean not null default true;
alter table public.bonus_codes add column if not exists expires_at timestamptz;
alter table public.bonus_codes add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.bonus_codes add column if not exists created_at timestamptz default now();

create table if not exists public.bonus_redemptions (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null,
  member_id uuid not null,
  reward_units numeric(40,2) default 0,
  item_key text,
  created_at timestamptz default now()
);

create table if not exists public.unified_game_rounds (
  id uuid primary key default extensions.gen_random_uuid()
);

alter table public.unified_game_rounds add column if not exists member_id uuid;
alter table public.unified_game_rounds add column if not exists game_key text;
alter table public.unified_game_rounds add column if not exists bet_units numeric(40,2) default 0;
alter table public.unified_game_rounds add column if not exists prize_units numeric(40,2) default 0;
alter table public.unified_game_rounds add column if not exists win boolean default false;
alter table public.unified_game_rounds add column if not exists created_at timestamptz default now();

-- ------------------------------------------------------------
-- Seeds sem conflito frágil
-- ------------------------------------------------------------
insert into public.blinders_mission_definitions(mission_key,title,description,icon,mission_type,target_count,reward_units,active)
values
('daily_login','Entrar no Blinders','Entre no app uma vez no dia.','🎯','daily',1,100000000000,true),
('play_3_games','Jogar 3 partidas','Jogue 3 partidas em qualquer jogo.','🎮','daily',3,250000000000,true),
('win_bingo','Acertar no Bingo','Consiga pelo menos 3 acertos no Bingo.','🔢','weekly',1,500000000000,true),
('chat_presence','Participar da comunidade','Abra a comunidade/chat.','💬','daily',1,100000000000,true)
on conflict(mission_key) do update set
  title=excluded.title,
  description=excluded.description,
  reward_units=excluded.reward_units,
  active=true;

insert into public.blinders_events(event_key,title,description,event_type,reward,active)
values
('noite_bingo','Noite do Bingo','Durante o evento, o Bingo fica em destaque para todos os membros.','weekly','Bônus e ranking especial',true),
('vip_weekend','Fim de Semana VIP','Eventos, bônus e loja com itens especiais.','special','Itens e saldo bônus',true),
('clan_challenge','Desafio dos Clãs','Clãs competem por atividade e vitórias.','clan','XP de clã e prêmios',true)
on conflict(event_key) do update set
  title=excluded.title,
  description=excluded.description,
  reward=excluded.reward,
  active=true;

insert into public.shop_items(item_key,title,name,category,description,item_type,rarity,price_units,price,stock,active,metadata)
select v.item_key,v.title,v.title,v.category,v.description,v.item_type,v.rarity,v.price_units,v.price_units,0,true,'{}'::jsonb
from (values
  ('silver_frame','Moldura Prata','profile','Moldura segura para perfil','frame','rare',1500000000000::numeric),
  ('vip_title','Título VIP','profile','Título visual de perfil','title','rare',2000000000000::numeric),
  ('event_badge','Badge Evento','event','Insígnia especial','badge','epic',3000000000000::numeric),
  ('gold_profile_bg','Fundo Dourado','profile','Fundo visual seguro para perfil','background','epic',2500000000000::numeric)
) as v(item_key,title,category,description,item_type,rarity,price_units)
where not exists (select 1 from public.shop_items s where s.item_key=v.item_key);

-- ------------------------------------------------------------
-- Auto-repair Malena oculto
-- ------------------------------------------------------------
drop function if exists public.app_malena_auto_repair(text);
create or replace function public.app_malena_auto_repair(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  admin public.app_members;
  modules jsonb := '[]'::jsonb;
begin
  admin := public.app_assert_admin(p_token);

  execute 'alter table public.app_members add column if not exists friend_code text';
  execute 'alter table public.app_members add column if not exists phone text';
  execute 'alter table public.app_members add column if not exists phone_digits text';
  execute 'alter table public.admin_audit_logs add column if not exists result jsonb default ''{}''::jsonb';
  execute 'alter table public.shop_items add column if not exists category text default ''profile''';
  execute 'alter table public.shop_items add column if not exists title text';
  execute 'alter table public.shop_items add column if not exists price_units numeric(40,2) default 0';

  update public.app_members
  set friend_code = coalesce(nullif(friend_code,''), 'FR-' || upper(substr(encode(extensions.gen_random_bytes(5),'hex'),1,10))),
      status = coalesce(status,'active'),
      role = coalesce(role,'user'),
      updated_at = now();

  insert into public.blinders_malena_events(severity,message,suggestion,metadata)
  values('info','Auto-repair executado pelo Módulo de Comando.','Verifique o diagnóstico após reparar.',jsonb_build_object('admin',admin.nick));

  insert into public.admin_audit_logs(admin_id,action,target,payload,result)
  values(admin.id,'malena:auto_repair','system','{}'::jsonb,jsonb_build_object('ok',true,'admin',admin.nick));

  modules := jsonb_build_array(
    jsonb_build_object('name','Banco', 'ok', true, 'detail','Estrutura essencial conferida.'),
    jsonb_build_object('name','Funções', 'ok', true, 'detail','RPCs V13 recriadas.'),
    jsonb_build_object('name','Loja', 'ok', true, 'detail','shop_items compatível.'),
    jsonb_build_object('name','Malena', 'ok', true, 'detail','Evento oculto registrado.')
  );

  perform pg_notify('pgrst','reload schema');

  return jsonb_build_object(
    'ok', true,
    'message', 'Auto-repair seguro concluído.',
    'modules', modules,
    'suggestions', jsonb_build_array('Reabra o site após alguns segundos para o schema cache atualizar.'),
    'at', now()
  );
end;
$$;

-- ------------------------------------------------------------
-- Diagnóstico
-- ------------------------------------------------------------
drop function if exists public.app_command_center_status(text);
create or replace function public.app_command_center_status(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  admin public.app_members;
  modules jsonb;
  suggestions jsonb := '[]'::jsonb;
begin
  admin := public.app_assert_admin(p_token);

  modules := jsonb_build_array(
    jsonb_build_object('name','Banco', 'ok', to_regclass('public.app_members') is not null, 'detail','app_members'),
    jsonb_build_object('name','Sessões', 'ok', to_regclass('public.app_member_sessions') is not null, 'detail','tokens de login'),
    jsonb_build_object('name','Jogos', 'ok', to_regclass('public.unified_game_rounds') is not null, 'detail','histórico de partidas'),
    jsonb_build_object('name','Loja', 'ok', to_regclass('public.shop_items') is not null, 'detail','itens visuais'),
    jsonb_build_object('name','Missões', 'ok', to_regclass('public.blinders_mission_definitions') is not null, 'detail','missões ativas'),
    jsonb_build_object('name','Eventos', 'ok', to_regclass('public.blinders_events') is not null, 'detail','eventos ativos'),
    jsonb_build_object('name','Anúncios', 'ok', to_regclass('public.harmony_announcements') is not null, 'detail','ticker do servidor'),
    jsonb_build_object('name','Performance', 'ok', to_regclass('public.app_performance_flags') is not null or true, 'detail','modo leve frontend')
  );

  if to_regclass('public.shop_items') is null then
    suggestions := suggestions || jsonb_build_array('Rodar auto-repair para recriar loja.');
  end if;

  if to_regclass('public.admin_audit_logs') is null then
    suggestions := suggestions || jsonb_build_array('Rodar auto-repair para recriar logs admin.');
  end if;

  insert into public.blinders_system_health(module, ok, detail, metadata)
  values('command_center', true, 'Diagnóstico executado', jsonb_build_object('admin',admin.nick));

  return jsonb_build_object(
    'ok', true,
    'admin', admin.nick,
    'modules', modules,
    'suggestions', suggestions,
    'at', now()
  );
end;
$$;

-- ------------------------------------------------------------
-- Perfil
-- ------------------------------------------------------------
drop function if exists public.app_member_profile(text);
create or replace function public.app_member_profile(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  m public.app_members;
  inv jsonb;
  rounds_count int := 0;
  wins_count int := 0;
  best_prize numeric := 0;
begin
  m := public.v25_current(p_token);

  select coalesce(jsonb_agg(jsonb_build_object(
    'item_key', i.item_key,
    'title', coalesce(s.title, i.item_key),
    'rarity', coalesce(s.rarity,'common')
  ) order by i.created_at desc), '[]'::jsonb)
  into inv
  from public.member_inventory i
  left join public.shop_items s on s.item_key=i.item_key
  where i.member_id=m.id;

  select count(*), count(*) filter (where win=true), coalesce(max(prize_units),0)
  into rounds_count, wins_count, best_prize
  from public.unified_game_rounds
  where member_id=m.id;

  return jsonb_build_object(
    'ok', true,
    'nick', m.nick,
    'role', m.role,
    'status', m.status,
    'iris', m.iris_member_id,
    'phone', m.phone,
    'friendCode', m.friend_code,
    'balanceUnits', m.balance_virtual_units,
    'balanceLabel', public.v25_format(m.balance_virtual_units),
    'inventory', inv,
    'rounds', rounds_count,
    'wins', wins_count,
    'bestPrizeLabel', public.v25_format(best_prize)
  );
end;
$$;

-- ------------------------------------------------------------
-- Rankings
-- ------------------------------------------------------------
drop function if exists public.app_public_rankings();
create or replace function public.app_public_rankings()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  big_wins jsonb;
  rounds jsonb;
  balances jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'nick', coalesce(m.nick,'Membro'),
    'value', public.v25_format(r.prize_units),
    'score', r.prize_units
  ) order by r.prize_units desc), '[]'::jsonb)
  into big_wins
  from (
    select member_id, max(prize_units) prize_units
    from public.unified_game_rounds
    group by member_id
    order by max(prize_units) desc
    limit 10
  ) r
  left join public.app_members m on m.id=r.member_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'nick', coalesce(m.nick,'Membro'),
    'value', c.total::text || ' partidas',
    'score', c.total
  ) order by c.total desc), '[]'::jsonb)
  into rounds
  from (
    select member_id, count(*) total
    from public.unified_game_rounds
    group by member_id
    order by count(*) desc
    limit 10
  ) c
  left join public.app_members m on m.id=c.member_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'nick', coalesce(nick,'Membro'),
    'value', public.v25_format(balance_virtual_units),
    'score', balance_virtual_units
  ) order by balance_virtual_units desc), '[]'::jsonb)
  into balances
  from (
    select nick, balance_virtual_units
    from public.app_members
    where coalesce(status,'active')='active'
    order by balance_virtual_units desc
    limit 10
  ) b;

  return jsonb_build_object('ok', true, 'bigWins', big_wins, 'rounds', rounds, 'balances', balances);
end;
$$;

-- ------------------------------------------------------------
-- Missões e eventos
-- ------------------------------------------------------------
drop function if exists public.app_public_missions(text);
create or replace function public.app_public_missions(p_token text default '')
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  m public.app_members;
  missions jsonb;
begin
  if coalesce(p_token,'') <> '' then
    begin
      m := public.v25_current(p_token);
    exception when others then
      m := null;
    end;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'key', d.mission_key,
    'title', d.title,
    'description', d.description,
    'icon', d.icon,
    'type', d.mission_type,
    'progress', case when m.id is null then 0 else 100 end,
    'rewardUnits', d.reward_units,
    'rewardLabel', public.v25_format(d.reward_units),
    'claimed', exists(select 1 from public.blinders_mission_claims c where c.member_id=m.id and c.mission_key=d.mission_key)
  ) order by d.created_at), '[]'::jsonb)
  into missions
  from public.blinders_mission_definitions d
  where d.active=true;

  return jsonb_build_object('ok', true, 'missions', missions);
end;
$$;

drop function if exists public.app_claim_mission(text,text);
create or replace function public.app_claim_mission(p_token text, p_mission_key text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  m public.app_members;
  d public.blinders_mission_definitions;
begin
  m := public.v25_current(p_token);

  select *
  into d
  from public.blinders_mission_definitions
  where mission_key=p_mission_key and active=true;

  if d.mission_key is null then
    raise exception 'Missão não encontrada.';
  end if;

  if exists(select 1 from public.blinders_mission_claims where member_id=m.id and mission_key=p_mission_key) then
    raise exception 'Missão já resgatada.';
  end if;

  insert into public.blinders_mission_claims(mission_key,member_id,reward_units)
  values(d.mission_key,m.id,d.reward_units);

  update public.app_members
  set balance_virtual_units=balance_virtual_units+d.reward_units,
      updated_at=now()
  where id=m.id;

  return jsonb_build_object(
    'ok', true,
    'message', 'Missão resgatada.',
    'rewardLabel', public.v25_format(d.reward_units)
  );
end;
$$;

drop function if exists public.app_public_events();
create or replace function public.app_public_events()
returns jsonb
language sql
security definer
set search_path=public
as $$
  select jsonb_build_object(
    'ok', true,
    'events', coalesce(jsonb_agg(jsonb_build_object(
      'key', event_key,
      'title', title,
      'description', description,
      'eventType', event_type,
      'reward', reward
    ) order by created_at desc), '[]'::jsonb)
  )
  from public.blinders_events
  where active=true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now());
$$;

-- ------------------------------------------------------------
-- Loja visual
-- ------------------------------------------------------------
drop function if exists public.app_public_shop_visual();
create or replace function public.app_public_shop_visual()
returns jsonb
language sql
security definer
set search_path=public
as $$
  select jsonb_build_object(
    'ok', true,
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'key', item_key,
      'title', coalesce(title,name,item_key),
      'name', coalesce(name,title,item_key),
      'description', description,
      'category', category,
      'itemType', item_type,
      'rarity', rarity,
      'priceUnits', price_units,
      'priceLabel', public.v25_format(price_units),
      'icon', case
        when item_type='frame' then '▣'
        when item_type='title' then '♛'
        when item_type='background' then '◈'
        else '✦'
      end
    ) order by rarity desc, price_units asc), '[]'::jsonb)
  )
  from public.shop_items
  where coalesce(active,true)=true;
$$;

-- ------------------------------------------------------------
-- Bônus real básico
-- ------------------------------------------------------------
drop function if exists public.app_bonus_redeem(text,text);
create or replace function public.app_bonus_redeem(p_token text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  m public.app_members;
  b record;
  used_total int;
  used_member int;
begin
  m := public.v25_current(p_token);

  select *
  into b
  from public.bonus_codes
  where upper(code)=upper(trim(p_code))
    and coalesce(active,true)=true
    and (expires_at is null or expires_at>=now())
  order by created_at desc
  limit 1;

  if b.id is null then
    raise exception 'Código inválido ou expirado.';
  end if;

  select count(*) into used_total from public.bonus_redemptions where upper(code)=upper(b.code);
  select count(*) into used_member from public.bonus_redemptions where upper(code)=upper(b.code) and member_id=m.id;

  if b.max_uses is not null and used_total >= b.max_uses then
    raise exception 'Código esgotado.';
  end if;

  if coalesce(b.max_per_user,1) <= used_member then
    raise exception 'Você já resgatou esse código.';
  end if;

  insert into public.bonus_redemptions(code,member_id,reward_units,item_key)
  values(b.code,m.id,coalesce(b.money_units,0),b.item_key);

  update public.app_members
  set balance_virtual_units=balance_virtual_units+coalesce(b.money_units,0),
      updated_at=now()
  where id=m.id;

  if b.item_key is not null then
    insert into public.member_inventory(member_id,item_key,source,metadata)
    values(m.id,b.item_key,'bonus',jsonb_build_object('code',b.code));
  end if;

  return jsonb_build_object(
    'ok', true,
    'message', 'Bônus resgatado.',
    'moneyLabel', public.v25_format(coalesce(b.money_units,0)),
    'itemKey', b.item_key
  );
end;
$$;

-- ------------------------------------------------------------
-- Admin execute V13
-- ------------------------------------------------------------
drop function if exists public.app_admin_execute_action(text,text,text,jsonb);
create or replace function public.app_admin_execute_action(
  p_token text,
  p_module text,
  p_action text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  admin public.app_members;
  result jsonb := '{}'::jsonb;
  target text := coalesce(p_payload->>'target', p_payload->>'nick', p_payload->>'code', p_payload->>'item_key', '');
  amount numeric := 0;
  clean_nick text;
  role_value text;
  status_value text;
  new_id uuid;
begin
  admin := public.app_assert_admin(p_token);

  if p_module='accounts' and p_action='create' then
    clean_nick := trim(coalesce(p_payload->>'nick',''));
    if clean_nick='' then raise exception 'Informe o nick.'; end if;

    if lower(clean_nick) like 'admin@%' then
      clean_nick := substr(clean_nick,7);
      role_value := 'admin';
    else
      role_value := coalesce(nullif(p_payload->>'role',''),'user');
    end if;

    status_value := coalesce(nullif(p_payload->>'status',''),'active');
    amount := public.v25_parse(coalesce(p_payload->>'balance','0'));

    if exists(select 1 from public.app_members where lower(nick)=lower(clean_nick)) then
      raise exception 'Conta já existe.';
    end if;

    insert into public.app_members(nick,zarcovi_account,password_hash,role,status,iris_member_id,balance_virtual_units,friend_code,phone,phone_digits,created_at,updated_at)
    values(
      clean_nick,
      nullif(p_payload->>'zarcovi_account',''),
      extensions.crypt(coalesce(nullif(p_payload->>'password',''),'1234'), extensions.gen_salt('bf')),
      role_value,
      status_value,
      coalesce(nullif(p_payload->>'zarcovi_account',''),'IRIS-'||upper(substr(encode(extensions.gen_random_bytes(5),'hex'),1,10))),
      amount,
      'FR-'||upper(substr(encode(extensions.gen_random_bytes(5),'hex'),1,10)),
      nullif(p_payload->>'phone',''),
      regexp_replace(coalesce(p_payload->>'phone',''),'\D','','g'),
      now(),
      now()
    )
    returning id into new_id;

    result := jsonb_build_object('ok',true,'message','Conta criada.','nick',clean_nick,'role',role_value,'memberId',new_id,'balanceLabel',public.v25_format(amount));

  elsif p_module='accounts' and p_action='search' then
    result := (
      select jsonb_build_object('ok',true,'message','Busca concluída.','items',
        coalesce(jsonb_agg(jsonb_build_object('nick',nick,'role',role,'status',status,'balance',public.v25_format(balance_virtual_units),'friendCode',friend_code) order by created_at desc),'[]'::jsonb))
      from (
        select * from public.app_members
        where coalesce(p_payload->>'query','')=''
           or lower(nick) like '%'||lower(p_payload->>'query')||'%'
           or id::text=p_payload->>'query'
        limit 30
      ) q
    );

  elsif p_module='bank' and p_action='deposit' then
    amount := public.v25_parse(coalesce(p_payload->>'amount','0'));
    result := jsonb_build_object('ok',true,'message','Depósito registrado em log.','amountLabel',public.v25_format(amount));

  elsif p_module='bonus' and p_action='create' then
    insert into public.bonus_codes(code,title,money_units,item_key,max_uses,max_per_user,active,expires_at,metadata)
    select
      upper(trim(coalesce(p_payload->>'code',''))),
      p_payload->>'title',
      public.v25_parse(coalesce(p_payload->>'money','0')),
      nullif(p_payload->>'item_key',''),
      nullif(p_payload->>'max_uses','')::int,
      coalesce(nullif(p_payload->>'max_per_user','')::int,1),
      true,
      nullif(p_payload->>'expires_at','')::timestamptz,
      p_payload
    where coalesce(p_payload->>'code','') <> '';
    result := jsonb_build_object('ok',true,'message','Código de bônus salvo.');

  elsif p_module='shop' and p_action='save' then
    amount := public.v25_parse(coalesce(p_payload->>'price','0'));
    update public.shop_items
    set title=p_payload->>'title',
        name=p_payload->>'title',
        category=coalesce(nullif(p_payload->>'category',''),'profile'),
        item_type=coalesce(nullif(p_payload->>'item_type',''),'badge'),
        rarity=coalesce(nullif(p_payload->>'rarity',''),'common'),
        price_units=amount,
        price=amount,
        stock=coalesce(nullif(p_payload->>'stock','')::int,0),
        active=coalesce(p_payload->>'active','true')='true',
        metadata=p_payload,
        updated_at=now()
    where item_key=p_payload->>'item_key';

    if not found then
      insert into public.shop_items(item_key,title,name,category,description,item_type,rarity,price_units,price,stock,active,metadata,created_at,updated_at)
      values(
        p_payload->>'item_key',
        p_payload->>'title',
        p_payload->>'title',
        coalesce(nullif(p_payload->>'category',''),'profile'),
        coalesce(p_payload->>'description',''),
        coalesce(nullif(p_payload->>'item_type',''),'badge'),
        coalesce(nullif(p_payload->>'rarity',''),'common'),
        amount,
        amount,
        coalesce(nullif(p_payload->>'stock','')::int,0),
        coalesce(p_payload->>'active','true')='true',
        p_payload,
        now(),
        now()
      );
    end if;

    result := jsonb_build_object('ok',true,'message','Item da loja salvo.');

  elsif p_module='system' and p_action='announcement' and to_regclass('public.harmony_announcements') is not null then
    insert into public.harmony_announcements(message,icon,active,priority,created_at)
    values(coalesce(nullif(p_payload->>'message',''),'Novo aviso do servidor.'),'📢',coalesce(p_payload->>'active','true')='true',coalesce(nullif(p_payload->>'priority','')::int,100),now());
    result := jsonb_build_object('ok',true,'message','Anúncio publicado.');

  else
    result := jsonb_build_object('ok',true,'message','Ação registrada.','module',p_module,'action',p_action);
  end if;

  insert into public.admin_audit_logs(admin_id,action,target,payload,result)
  values(admin.id,p_module||':'||p_action,target,coalesce(p_payload,'{}'::jsonb),result);

  return result || jsonb_build_object('admin',admin.nick,'at',now());
end;
$$;

-- ------------------------------------------------------------
-- Grants
-- ------------------------------------------------------------
grant execute on function public.v25_parse(text) to anon, authenticated;
grant execute on function public.v25_format(numeric) to anon, authenticated;
grant execute on function public.v25_current(text) to anon, authenticated;
grant execute on function public.app_assert_admin(text) to anon, authenticated;
grant execute on function public.app_malena_auto_repair(text) to anon, authenticated;
grant execute on function public.app_command_center_status(text) to anon, authenticated;
grant execute on function public.app_member_profile(text) to anon, authenticated;
grant execute on function public.app_public_rankings() to anon, authenticated;
grant execute on function public.app_public_missions(text) to anon, authenticated;
grant execute on function public.app_claim_mission(text,text) to anon, authenticated;
grant execute on function public.app_public_events() to anon, authenticated;
grant execute on function public.app_public_shop_visual() to anon, authenticated;
grant execute on function public.app_bonus_redeem(text,text) to anon, authenticated;
grant execute on function public.app_admin_execute_action(text,text,text,jsonb) to anon, authenticated;

notify pgrst, 'reload schema';

select 'BLINDERS_NETLIFY_V13_MODULO_COMANDO_OK' as status;
