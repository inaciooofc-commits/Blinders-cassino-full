-- ============================================================
-- BLINDERS CASSINO — NETLIFY EVOLUTION FULL
-- Admin Center definitivo, bônus, eventos, clãs, loja,
-- inventário, chat, segurança, relatórios e funções seguras.
--
-- Rode depois do SQL Netlify Engine Build.
--
-- Resultado esperado:
-- BLINDERS_NETLIFY_EVOLUTION_FULL_OK
-- ============================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Garantias base
create table if not exists public.app_members (id uuid primary key default extensions.gen_random_uuid());
alter table public.app_members add column if not exists nick text;
alter table public.app_members add column if not exists role text default 'user';
alter table public.app_members add column if not exists status text default 'pending';
alter table public.app_members add column if not exists balance_virtual_units numeric(40,2) not null default 0;
alter table public.app_members add column if not exists iris_member_id text;
alter table public.app_members add column if not exists created_at timestamptz default now();
alter table public.app_members add column if not exists updated_at timestamptz default now();

create table if not exists public.app_member_sessions (id uuid primary key default extensions.gen_random_uuid());
alter table public.app_member_sessions add column if not exists member_id uuid;
alter table public.app_member_sessions add column if not exists token text;
alter table public.app_member_sessions add column if not exists expires_at timestamptz default now()+interval '30 days';
alter table public.app_member_sessions add column if not exists created_at timestamptz default now();

create table if not exists public.iris_transactions (id uuid primary key default extensions.gen_random_uuid());
alter table public.iris_transactions add column if not exists tx_code text;
alter table public.iris_transactions add column if not exists astral_code text;
alter table public.iris_transactions add column if not exists type text;
alter table public.iris_transactions add column if not exists status text default 'pending';
alter table public.iris_transactions add column if not exists from_member_id uuid;
alter table public.iris_transactions add column if not exists to_member_id uuid;
alter table public.iris_transactions add column if not exists amount_units numeric(40,2) default 0;
alter table public.iris_transactions add column if not exists amount_label text;
alter table public.iris_transactions add column if not exists description text;
alter table public.iris_transactions add column if not exists metadata jsonb not null default '{}';
alter table public.iris_transactions add column if not exists created_at timestamptz default now();
alter table public.iris_transactions add column if not exists confirmed_at timestamptz;

create table if not exists public.iris_bank_accounts_mod020 (
  bank_key text primary key,
  display_name text not null,
  iris_id text not null unique,
  balance_units numeric(40,2) not null default 0,
  deposits_total_units numeric(40,2) not null default 0,
  table_fee_units numeric(40,2) not null default 0,
  solo_profit_units numeric(40,2) not null default 0,
  reserve_percent numeric(8,2) not null default 10,
  max_single_prize_percent numeric(8,2) not null default 10,
  status text not null default 'active',
  updated_at timestamptz default now()
);

insert into public.iris_bank_accounts_mod020(bank_key,display_name,iris_id,balance_units)
values('EMSHBY','Banco EMSHBY','EMSHBY',100000000000000)
on conflict(bank_key) do update set status='active', updated_at=now();

-- Helpers compatíveis
drop function if exists public.v25_format(numeric);
create or replace function public.v25_format(p_units numeric)
returns text language plpgsql immutable as $$
declare v numeric := coalesce(p_units,0);
begin
  if abs(v)>=1000000000000 then return trim(to_char(v/1000000000000,'FM999999999999990D00'))||'T'; end if;
  if abs(v)>=1000000000 then return trim(to_char(v/1000000000,'FM999999999999990D00'))||'B'; end if;
  return trim(to_char(v,'FM999999999999990D00'));
end;
$$;

drop function if exists public.v25_parse(text);
create or replace function public.v25_parse(p_amount text)
returns numeric language plpgsql immutable as $$
declare s text := upper(trim(coalesce(p_amount,''))); n numeric;
begin
  if s='' then raise exception 'Valor vazio.'; end if;
  s := replace(replace(s,' ',''),',','.');
  if s like '%T' then n := nullif(regexp_replace(s,'[^0-9.\-]','','g'),'')::numeric; return greatest(n,0)*1000000000000; end if;
  if s like '%B' then n := nullif(regexp_replace(s,'[^0-9.\-]','','g'),'')::numeric; return greatest(n,0)*1000000000; end if;
  n := nullif(regexp_replace(s,'[^0-9.\-]','','g'),'')::numeric;
  return greatest(n,0);
exception when others then raise exception 'Valor inválido.'; end;
$$;

drop function if exists public.v25_current(text);
create or replace function public.v25_current(p_token text)
returns public.app_members language plpgsql security definer set search_path=public,extensions as $$
declare m public.app_members;
begin
  select a.* into m
  from public.app_member_sessions s
  join public.app_members a on a.id=s.member_id
  where s.token=p_token and s.expires_at>now()
  limit 1;
  if m.id is null then raise exception 'Sessão expirada. Entre novamente.'; end if;
  return m;
end;
$$;

create or replace function public.v25_tx()
returns text language sql volatile set search_path=public,extensions as $$
select 'TX-'||to_char(now(),'YYYYMMDD-HH24MISS')||'-'||upper(substr(encode(extensions.gen_random_bytes(4),'hex'),1,8))
$$;

create or replace function public.v25_astral()
returns text language sql volatile set search_path=public,extensions as $$
select 'AST-'||upper(substr(encode(extensions.gen_random_bytes(5),'hex'),1,10))
$$;

drop function if exists public.app_assert_admin(text);
create or replace function public.app_assert_admin(p_token text)
returns public.app_members language plpgsql security definer set search_path=public,extensions as $$
declare m public.app_members;
begin
  m := public.v25_current(p_token);
  if coalesce(m.role,'user') not in ('admin','owner') then
    raise exception 'Acesso reservado para admin/dono.';
  end if;
  return m;
end;
$$;

-- Admin audit e segurança
create table if not exists public.admin_audit_logs (
  id bigint generated by default as identity primary key,
  admin_id uuid,
  action text not null,
  target text,
  payload jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.security_events (
  id bigint generated by default as identity primary key,
  member_id uuid,
  event_key text not null,
  severity text default 'info',
  payload jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz default now()
);

insert into public.system_settings(key,value)
values
('lock','{"enabled":false}'::jsonb),
('maintenance','{"enabled":false,"message":"Sistema em manutenção."}'::jsonb),
('safe_mode','{"enabled":false}'::jsonb),
('pwa','{"enabled":true,"cache":"safe"}'::jsonb)
on conflict(key) do nothing;

-- Bônus e eventos
create table if not exists public.bonus_codes (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique,
  title text,
  money_units numeric(40,2) default 0,
  item_key text,
  max_uses int,
  max_per_user int default 1,
  role_required text,
  clan_id uuid,
  active boolean not null default true,
  starts_at timestamptz default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.bonus_redemptions (
  id uuid primary key default extensions.gen_random_uuid(),
  bonus_id uuid,
  member_id uuid,
  code text not null,
  money_units numeric(40,2) default 0,
  item_key text,
  created_at timestamptz default now()
);

create table if not exists public.events_calendar (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  event_type text default 'special',
  description text,
  reward jsonb not null default '{}',
  active boolean not null default true,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  created_at timestamptz default now()
);

insert into public.bonus_codes(code,title,money_units,max_uses,max_per_user,active,metadata)
values('BEMVINDO','Bônus de boas-vindas',1500000000,500,1,true,'{"kind":"welcome"}'::jsonb)
on conflict(code) do nothing;

-- Loja e inventário
create table if not exists public.shop_items (
  id uuid primary key default extensions.gen_random_uuid(),
  item_key text not null unique,
  title text not null,
  description text,
  item_type text default 'badge',
  rarity text default 'common',
  price_units numeric(40,2) not null default 0,
  stock_limit int,
  active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.member_inventory (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid,
  item_key text not null,
  source text default 'shop',
  metadata jsonb not null default '{}',
  created_at timestamptz default now()
);

insert into public.shop_items(item_key,title,description,item_type,rarity,price_units,active)
values
('silver_frame','Moldura Prata','Moldura segura para perfil','frame','rare',1500000000000,true),
('vip_title','Título VIP','Título visual de perfil','title','rare',2000000000000,true),
('event_badge','Badge Evento','Insígnia especial','badge','epic',3000000000000,true)
on conflict(item_key) do nothing;

-- Clãs
create table if not exists public.clans (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null unique,
  description text,
  owner_id uuid,
  leader_id uuid,
  coffer_units numeric(40,2) not null default 0,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists public.clan_members (
  id uuid primary key default extensions.gen_random_uuid(),
  clan_id uuid,
  member_id uuid,
  clan_role text default 'member',
  joined_at timestamptz default now(),
  unique(clan_id, member_id)
);

create table if not exists public.clan_transactions (
  id uuid primary key default extensions.gen_random_uuid(),
  clan_id uuid,
  member_id uuid,
  tx_type text,
  amount_units numeric(40,2) default 0,
  description text,
  created_at timestamptz default now()
);

-- Chat e moderação
create table if not exists public.chat_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  channel text not null default 'global',
  member_id uuid,
  clan_id uuid,
  message text not null,
  status text default 'visible',
  metadata jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.friendships (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid,
  friend_id uuid,
  status text default 'pending',
  created_at timestamptz default now(),
  unique(member_id, friend_id)
);

create table if not exists public.reports (
  id uuid primary key default extensions.gen_random_uuid(),
  reporter_id uuid,
  target_member_id uuid,
  target_message_id uuid,
  category text,
  description text,
  status text default 'open',
  created_at timestamptz default now()
);

-- Relatórios/sangria/backups
create table if not exists public.daily_reports (
  id uuid primary key default extensions.gen_random_uuid(),
  report_date date not null default current_date,
  report_type text default 'daily',
  payload jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.version_backups (
  id uuid primary key default extensions.gen_random_uuid(),
  label text not null,
  payload jsonb not null default '{}',
  created_by uuid,
  created_at timestamptz default now()
);

-- Índices
create index if not exists ix_bonus_redemptions_member on public.bonus_redemptions(member_id, created_at desc);
create index if not exists ix_inventory_member on public.member_inventory(member_id, created_at desc);
create index if not exists ix_clan_members_member on public.clan_members(member_id);
create index if not exists ix_chat_channel_time on public.chat_messages(channel, created_at desc);
create index if not exists ix_reports_status on public.reports(status, created_at desc);
create index if not exists ix_admin_audit_time on public.admin_audit_logs(created_at desc);
create index if not exists ix_security_events_time on public.security_events(created_at desc);

-- RPCs
drop function if exists public.app_bonus_redeem(text,text);
create or replace function public.app_bonus_redeem(p_token text, p_code text)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare
  m public.app_members;
  b public.bonus_codes;
  used_total int;
  used_user int;
begin
  m := public.v25_current(p_token);
  select * into b from public.bonus_codes where upper(code)=upper(trim(p_code)) and active=true;
  if b.id is null then raise exception 'Código de bônus inválido ou inativo.'; end if;
  if b.expires_at is not null and b.expires_at<now() then raise exception 'Código expirado.'; end if;
  if b.role_required is not null and b.role_required<>m.role then raise exception 'Este código não está liberado para seu cargo.'; end if;

  select count(*) into used_total from public.bonus_redemptions where bonus_id=b.id;
  select count(*) into used_user from public.bonus_redemptions where bonus_id=b.id and member_id=m.id;
  if b.max_uses is not null and used_total>=b.max_uses then raise exception 'Limite total do código atingido.'; end if;
  if b.max_per_user is not null and used_user>=b.max_per_user then raise exception 'Você já resgatou este código.'; end if;

  if coalesce(b.money_units,0)>0 then
    update public.app_members set balance_virtual_units=balance_virtual_units+b.money_units, updated_at=now() where id=m.id;
  end if;

  if b.item_key is not null then
    insert into public.member_inventory(member_id,item_key,source,metadata)
    values(m.id,b.item_key,'bonus',jsonb_build_object('code',b.code));
  end if;

  insert into public.bonus_redemptions(bonus_id,member_id,code,money_units,item_key)
  values(b.id,m.id,b.code,coalesce(b.money_units,0),b.item_key);

  return jsonb_build_object('ok',true,'message','Bônus resgatado.','moneyLabel',public.v25_format(coalesce(b.money_units,0)),'itemKey',b.item_key);
end;
$$;

drop function if exists public.app_clan_request_create(text,text,text);
create or replace function public.app_clan_request_create(p_token text, p_name text, p_description text default null)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare m public.app_members; cost numeric := 15000000000000; cid uuid;
begin
  m := public.v25_current(p_token);
  if coalesce(m.balance_virtual_units,0)<cost then raise exception 'Criar clã custa 15T.'; end if;
  update public.app_members set balance_virtual_units=balance_virtual_units-cost, updated_at=now() where id=m.id;
  insert into public.clans(name,description,owner_id,leader_id,coffer_units,status)
  values(trim(p_name),p_description,m.id,m.id,0,'active')
  returning id into cid;
  insert into public.clan_members(clan_id,member_id,clan_role) values(cid,m.id,'leader');
  return jsonb_build_object('ok',true,'clanId',cid,'costLabel','15T');
end;
$$;

drop function if exists public.app_shop_buy_item(text,text);
create or replace function public.app_shop_buy_item(p_token text, p_item_key text)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare m public.app_members; item public.shop_items; sold int;
begin
  m := public.v25_current(p_token);
  select * into item from public.shop_items where item_key=p_item_key and active=true;
  if item.id is null then raise exception 'Item não encontrado.'; end if;
  if coalesce(m.balance_virtual_units,0)<item.price_units then raise exception 'Saldo insuficiente.'; end if;
  if item.stock_limit is not null then
    select count(*) into sold from public.member_inventory where item_key=item.item_key;
    if sold>=item.stock_limit then raise exception 'Estoque esgotado.'; end if;
  end if;
  update public.app_members set balance_virtual_units=balance_virtual_units-item.price_units, updated_at=now() where id=m.id;
  insert into public.member_inventory(member_id,item_key,source,metadata) values(m.id,item.item_key,'shop',jsonb_build_object('price',item.price_units));
  return jsonb_build_object('ok',true,'item',item.item_key,'priceLabel',public.v25_format(item.price_units));
end;
$$;

drop function if exists public.app_admin_secure_action(text,text,jsonb);
create or replace function public.app_admin_secure_action(p_token text, p_action text, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare admin public.app_members;
begin
  admin := public.app_assert_admin(p_token);
  insert into public.admin_audit_logs(admin_id,action,target,payload)
  values(admin.id,coalesce(p_action,'unknown'),p_payload->>'target',coalesce(p_payload,'{}'::jsonb));
  return jsonb_build_object('ok',true,'message','Ação registrada.','action',p_action,'admin',admin.nick);
end;
$$;

drop function if exists public.app_admin_confirm_deposit(text,text,text,text);
create or replace function public.app_admin_confirm_deposit(p_token text, p_code text, p_amount text, p_note text default '')
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare admin public.app_members; amount numeric;
begin
  admin := public.app_assert_admin(p_token);
  amount := public.v25_parse(p_amount);
  update public.iris_bank_accounts_mod020
  set balance_units=balance_units+amount, deposits_total_units=deposits_total_units+amount, updated_at=now()
  where bank_key='EMSHBY';
  insert into public.admin_audit_logs(admin_id,action,target,payload)
  values(admin.id,'confirm_deposit',p_code,jsonb_build_object('amount',amount,'note',p_note));
  return jsonb_build_object('ok',true,'message','Depósito registrado.','amountLabel',public.v25_format(amount));
end;
$$;

drop function if exists public.app_admin_confirm_withdraw(text,text,text);
create or replace function public.app_admin_confirm_withdraw(p_token text, p_code text, p_note text default '')
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare admin public.app_members;
begin
  admin := public.app_assert_admin(p_token);
  insert into public.admin_audit_logs(admin_id,action,target,payload)
  values(admin.id,'confirm_withdraw',p_code,jsonb_build_object('note',p_note));
  return jsonb_build_object('ok',true,'message','Saque marcado como conferido.');
end;
$$;

drop function if exists public.app_report_generate(text,text);
create or replace function public.app_report_generate(p_token text, p_report_type text default 'daily')
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare admin public.app_members; payload jsonb;
begin
  admin := public.app_assert_admin(p_token);
  payload := jsonb_build_object(
    'date',current_date,
    'type',p_report_type,
    'transactions',(select count(*) from public.iris_transactions where created_at::date=current_date),
    'deposits',(select coalesce(deposits_total_units,0) from public.iris_bank_accounts_mod020 where bank_key='EMSHBY'),
    'bank',(select coalesce(balance_units,0) from public.iris_bank_accounts_mod020 where bank_key='EMSHBY'),
    'membersToday',(select count(*) from public.app_members where created_at::date=current_date)
  );
  insert into public.daily_reports(report_type,payload) values(p_report_type,payload);
  return jsonb_build_object('ok',true,'report',payload);
end;
$$;

grant execute on function public.app_bonus_redeem(text,text) to anon, authenticated;
grant execute on function public.app_clan_request_create(text,text,text) to anon, authenticated;
grant execute on function public.app_shop_buy_item(text,text) to anon, authenticated;
grant execute on function public.app_admin_secure_action(text,text,jsonb) to anon, authenticated;
grant execute on function public.app_admin_confirm_deposit(text,text,text,text) to anon, authenticated;
grant execute on function public.app_admin_confirm_withdraw(text,text,text) to anon, authenticated;
grant execute on function public.app_report_generate(text,text) to anon, authenticated;
grant execute on function public.app_assert_admin(text) to anon, authenticated;

notify pgrst, 'reload schema';

select 'BLINDERS_NETLIFY_EVOLUTION_FULL_OK' as status;
