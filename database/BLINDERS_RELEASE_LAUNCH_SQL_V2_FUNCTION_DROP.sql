-- ============================================================
-- BLINDERS HOTFIX — DROP FUNCTIONS BEFORE RECREATE
-- Corrige:
-- ERROR 42P13: cannot change return type of existing function
--
-- Motivo:
-- O Supabase/Postgres não permite trocar o tipo de retorno de uma função
-- usando CREATE OR REPLACE FUNCTION.
-- É necessário apagar a função antiga primeiro.
-- ============================================================

drop function if exists public.app_tx(uuid,text,numeric,text,text,jsonb);
drop function if exists public.app_is_admin(uuid);
drop function if exists public.app_current(text);
drop function if exists public.app_seed();
drop function if exists public.app_guest_session(text);
drop function if exists public.app_wallet(text);
drop function if exists public.app_deposit(text,numeric,text);
drop function if exists public.app_withdraw(text,numeric,text);
drop function if exists public.app_transfer(text,text,numeric);
drop function if exists public.app_play_game(text,text,numeric,text,jsonb);
drop function if exists public.app_buy_item(text,text);
drop function if exists public.app_admin_set_item_price(text,text,numeric);
drop function if exists public.app_admin_set_game_maintenance(text,text,boolean);
drop function if exists public.app_admin_set_radio(text,text,text);
drop function if exists public.app_radio_now(text);
drop function if exists public.app_admin_bonus(text,numeric);
drop function if exists public.app_create_family(text,text,text);
drop function if exists public.app_start_travel(text,text,text);
drop function if exists public.app_attack_territory(text,text);
drop function if exists public.app_marriage_request(text,text);

notify pgrst, 'reload schema';

select 'BLINDERS_HOTFIX_DROP_FUNCTIONS_OK' as status;

-- ============================================================
-- BLINDERS RELEASE LAUNCH SQL
-- SQL ONLY MODE. Dinheiro em B no banco:
-- 1 = 1b, 1000 = 1T na interface.
-- Resultado esperado: BLINDERS_RELEASE_LAUNCH_SQL_V2_OK
-- ============================================================
create extension if not exists pgcrypto;

create table if not exists public.blinders_members (id uuid primary key default gen_random_uuid());
alter table public.blinders_members
  add column if not exists nick text not null default 'Membro',
  add column if not exists iris_id text not null default ('IRIS-' || upper(substr(encode(gen_random_bytes(5),'hex'),1,10))),
  add column if not exists friend_code text not null default ('FR-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,8))),
  add column if not exists phone text default '',
  add column if not exists role text not null default 'member',
  add column if not exists level int not null default 1,
  add column if not exists xp numeric(40,2) not null default 0,
  add column if not exists balance numeric(40,2) not null default 0,
  add column if not exists locked numeric(40,2) not null default 0,
  add column if not exists vip_points integer not null default 0,
  add column if not exists location_key text not null default 'vila_neon',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists last_seen timestamptz not null default now();

with ranked as (
  select id, row_number() over(partition by lower(nick) order by created_at,id) rn from public.blinders_members where nick is not null
)
delete from public.blinders_members m using ranked r where m.id=r.id and r.rn>1;
create unique index if not exists ux_blinders_members_nick on public.blinders_members(lower(nick));
create unique index if not exists ux_blinders_members_iris on public.blinders_members(lower(iris_id));
create unique index if not exists ux_blinders_members_friend on public.blinders_members(lower(friend_code));

create table if not exists public.blinders_sessions (token text primary key);
alter table public.blinders_sessions
  add column if not exists member_id uuid references public.blinders_members(id) on delete cascade,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists expires_at timestamptz not null default now() + interval '30 days';

create table if not exists public.blinders_transactions (id uuid primary key default gen_random_uuid());
alter table public.blinders_transactions
  add column if not exists member_id uuid references public.blinders_members(id) on delete cascade,
  add column if not exists type text not null default 'tx',
  add column if not exists amount numeric(40,2) not null default 0,
  add column if not exists status text not null default 'completed',
  add column if not exists description text default '',
  add column if not exists metadata jsonb not null default '{}',
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.blinders_game_rounds (id uuid primary key default gen_random_uuid());
alter table public.blinders_game_rounds
  add column if not exists member_id uuid references public.blinders_members(id) on delete cascade,
  add column if not exists game_key text not null default 'game',
  add column if not exists bet numeric(40,2) not null default 0,
  add column if not exists payout numeric(40,2) not null default 0,
  add column if not exists win boolean not null default false,
  add column if not exists mode text not null default 'single',
  add column if not exists result jsonb not null default '{}',
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.blinders_inventory (id uuid primary key default gen_random_uuid());
alter table public.blinders_inventory
  add column if not exists member_id uuid references public.blinders_members(id) on delete cascade,
  add column if not exists item_key text not null default 'item',
  add column if not exists item_name text not null default 'Item',
  add column if not exists price numeric(40,2) not null default 0,
  add column if not exists quantity int not null default 1,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.blinders_shop_items (item_key text primary key);
alter table public.blinders_shop_items
  add column if not exists title text not null default 'Item',
  add column if not exists description text not null default '',
  add column if not exists item_type text not null default 'cosmetic',
  add column if not exists rarity text not null default 'common',
  add column if not exists price numeric(40,2) not null default 0,
  add column if not exists speed_multiplier numeric(8,4) not null default 1,
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.blinders_game_status (game_key text primary key);
alter table public.blinders_game_status
  add column if not exists title text not null default 'Jogo',
  add column if not exists maintenance boolean not null default false,
  add column if not exists live_enabled boolean not null default true,
  add column if not exists duel_enabled boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.blinders_radio (id int primary key default 1);
alter table public.blinders_radio
  add column if not exists title text not null default '',
  add column if not exists youtube_url text not null default '',
  add column if not exists active boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.blinders_families (id uuid primary key default gen_random_uuid());
alter table public.blinders_families
  add column if not exists name text not null default 'Família',
  add column if not exists kind text not null default 'family',
  add column if not exists owner_id uuid references public.blinders_members(id) on delete set null,
  add column if not exists power numeric(40,2) not null default 0,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.blinders_territories (territory_key text primary key);
alter table public.blinders_territories
  add column if not exists title text not null default 'Território',
  add column if not exists x numeric not null default 0,
  add column if not exists y numeric not null default 0,
  add column if not exists owner_family_id uuid references public.blinders_families(id) on delete set null,
  add column if not exists defense numeric(40,2) not null default 100,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.blinders_travels (id uuid primary key default gen_random_uuid());
alter table public.blinders_travels
  add column if not exists member_id uuid references public.blinders_members(id) on delete cascade,
  add column if not exists from_key text not null default 'vila_neon',
  add column if not exists to_key text not null default 'vila_neon',
  add column if not exists item_key text default '',
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists arrives_at timestamptz not null default now();

create table if not exists public.blinders_marriages (id uuid primary key default gen_random_uuid());
alter table public.blinders_marriages
  add column if not exists requester_id uuid references public.blinders_members(id) on delete cascade,
  add column if not exists target_id uuid references public.blinders_members(id) on delete cascade,
  add column if not exists status text not null default 'pending',
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.blinders_audit (id uuid primary key default gen_random_uuid());
alter table public.blinders_audit
  add column if not exists member_id uuid references public.blinders_members(id) on delete set null,
  add column if not exists action text not null default 'system',
  add column if not exists message text default '',
  add column if not exists metadata jsonb not null default '{}',
  add column if not exists created_at timestamptz not null default now();

alter table public.blinders_members enable row level security;
alter table public.blinders_sessions enable row level security;
alter table public.blinders_transactions enable row level security;
alter table public.blinders_game_rounds enable row level security;
alter table public.blinders_inventory enable row level security;
alter table public.blinders_shop_items enable row level security;
alter table public.blinders_game_status enable row level security;
alter table public.blinders_radio enable row level security;
alter table public.blinders_families enable row level security;
alter table public.blinders_territories enable row level security;
alter table public.blinders_travels enable row level security;
alter table public.blinders_marriages enable row level security;
alter table public.blinders_audit enable row level security;

create or replace function public.app_is_admin(p_member uuid)
returns boolean language sql security definer set search_path=public as $$
  select exists(select 1 from public.blinders_members where id=p_member and role in ('admin','owner'));
$$;

create or replace function public.app_current(p_token text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_member uuid;
begin
  select member_id into v_member from public.blinders_sessions where token=p_token and expires_at>now() limit 1;
  if v_member is null then raise exception 'Sessão inválida ou expirada.'; end if;
  update public.blinders_members set last_seen=now() where id=v_member;
  return v_member;
end;
$$;

create or replace function public.app_tx(p_member uuid,p_type text,p_amount numeric,p_desc text,p_status text default 'completed',p_meta jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
  insert into public.blinders_transactions(member_id,type,amount,status,description,metadata)
  values(p_member,p_type,p_amount,p_status,p_desc,coalesce(p_meta,'{}'::jsonb));
end;
$$;

create or replace function public.app_seed()
returns void language plpgsql security definer set search_path=public as $$
begin
  insert into public.blinders_members(nick,iris_id,friend_code,role,level,balance,vip_points)
  values ('KageShinobi','IRIS-KAGE-777','KS-777','admin',87,25430.75,12870),
         ('Shinigami_7','IRIS-SHINI-777','SG-777','member',76,50000,7000),
         ('AzulNeon','IRIS-AZUL-777','AZ-777','member',64,35000,6000),
         ('ShadowBR','IRIS-SHADOW-777','SH-777','member',55,28000,4000),
         ('IrisQueen','IRIS-QUEEN-777','IQ-777','member',73,22000,3800)
  on conflict(lower(nick)) do update set role=excluded.role, level=excluded.level;

  insert into public.blinders_game_status(game_key,title,maintenance,live_enabled,duel_enabled)
  values ('roulette','Roulette',false,true,false),('blackjack','Blackjack',false,true,true),('bingo','Bingo',false,true,false),('dice','Dice',false,true,true),('slots','Slots',false,true,false),('memory','Memory',false,true,true),('crash','Crash',false,true,false),('poker','Poker',false,true,true)
  on conflict(game_key) do update set title=excluded.title;

  insert into public.blinders_radio(id,title,youtube_url,active) values(1,'','',false) on conflict(id) do nothing;

  insert into public.blinders_shop_items(item_key,title,description,item_type,rarity,price,speed_multiplier,active)
  values
    ('pergaminho_turbo','Pergaminho Turbo','Reduz tempo de viagem leve','travel','common',25,0.82,true),('chave_do_cofre','Chave do Cofre','Abre bônus do Banco IRIS','bonus','rare',40,1,true),('cristal_azul','Cristal Azul','Item de status','cosmetic','rare',55,1,true),('cristal_roxo','Cristal Roxo','Item raro visual','cosmetic','rare',75,1,true),('anel_shinobi','Anel Shinobi','Item para casamento','social','rare',90,1,true),('coroa_vip','Coroa VIP','Status VIP','vip','epic',120,1,true),('bilhete_elite','Bilhete Elite','Entrada em torneios','ticket','common',35,1,true),('passe_de_viagem','Passe de Viagem','Acelera viagens','travel','common',60,0.82,true),('mascara_sombria','Máscara Sombria','Item de máfia','mafia','rare',80,1,true),('kunai_dourada','Kunai Dourada','Ataques territoriais','attack','rare',95,1,true),('mapa_secreto','Mapa Secreto','Revela rotas','map','rare',110,1,true),('selo_de_familia','Selo de Família','Criar família','family','epic',130,1,true),('contrato_mafia','Contrato Máfia','Criar máfia','mafia','epic',150,1,true),('barco_rapido','Barco Rápido','Viagem marítima rápida','travel','epic',180,0.65,true),('moto_neon','Moto Neon','Locomoção urbana','travel','epic',220,0.55,true),('carro_blindado','Carro Blindado','Viagem e proteção','travel','epic',350,0.42,true),('jato_privado','Jato Privado','Viagem ultra rápida','travel','legendary',700,0.22,true),('portal_iris','Portal IRIS','Teleporte raro','travel','legendary',1000,0.05,true),('moldura_neon','Moldura Neon','Perfil visual','cosmetic','rare',75,1,true),('badge_diamante','Badge Diamante','Insígnia rara','cosmetic','rare',120,1,true),('titulo_kage','Título Kage','Título premium','cosmetic','epic',250,1,true),('skin_azul','Skin Azul','Tema de perfil','cosmetic','common',90,1,true),('skin_roxa','Skin Roxa','Tema de perfil','cosmetic','common',90,1,true),('ticket_torneio','Ticket Torneio','Entrada em evento','ticket','common',50,1,true),('escudo_territorial','Escudo Territorial','Defesa de território','territory','epic',300,1,true),('bomba_de_fumaca','Bomba de Fumaça','Reduz risco de ataque','attack','rare',160,1,true),('espiao','Espião','Coleta informação','attack','epic',210,1,true),('radio_premium','Rádio Premium','Benefício social','social','rare',140,1,true),('bau_lendario','Baú Lendário','Item surpresa','box','legendary',500,1,true),('cartao_ouro','Cartão Ouro','Status e bônus','vip','epic',450,1,true)
  on conflict(item_key) do update set title=excluded.title,description=excluded.description,price=excluded.price,speed_multiplier=excluded.speed_multiplier,active=true;

  insert into public.blinders_territories(territory_key,title,x,y,defense)
  values ('vila_neon','Vila Neon',0,0,100),('porto_iris','Porto IRIS',220,80,130),('torre_kage','Torre Kage',420,160,160),('mercado_sombra','Mercado Sombra',160,360,120),('arena_duelo','Arena Duelo',520,390,200),('templo_cristal','Templo Cristal',780,250,250),('base_mafia','Base Máfia',900,480,280),('deserto_azul','Deserto Azul',1150,300,220)
  on conflict(territory_key) do update set title=excluded.title,x=excluded.x,y=excluded.y,defense=excluded.defense;
end;
$$;

create or replace function public.app_guest_session(p_nick text default 'KageShinobi')
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_member public.blinders_members; v_token text; v_nick text := coalesce(nullif(trim(p_nick),''),'KageShinobi');
begin
  perform public.app_seed();
  select * into v_member from public.blinders_members where lower(nick)=lower(v_nick) limit 1;
  if v_member.id is null then insert into public.blinders_members(nick,balance,level) values(v_nick,1000,1) returning * into v_member; end if;
  v_token := encode(gen_random_bytes(32),'hex');
  insert into public.blinders_sessions(token,member_id) values(v_token,v_member.id);
  return jsonb_build_object('ok',true,'token',v_token,'member',jsonb_build_object('nick',v_member.nick,'iris',v_member.iris_id,'friendCode',v_member.friend_code,'role',v_member.role,'level',v_member.level));
end;
$$;

create or replace function public.app_wallet(p_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_member_id uuid; v_member public.blinders_members; v_tx jsonb; v_rank jsonb; v_status jsonb; v_radio jsonb;
begin
  v_member_id := public.app_current(p_token);
  select * into v_member from public.blinders_members where id=v_member_id;
  select coalesce(jsonb_agg(jsonb_build_object('type',type,'amount',amount,'description',description,'status',status,'time',created_at) order by created_at desc),'[]'::jsonb) into v_tx from (select * from public.blinders_transactions where member_id=v_member_id order by created_at desc limit 30) q;
  select coalesce(jsonb_agg(jsonb_build_object('nick',nick,'score',round(balance+vip_points)) order by (balance+vip_points) desc),'[]'::jsonb) into v_rank from (select nick,balance,vip_points from public.blinders_members order by (balance+vip_points) desc limit 10) r;
  select coalesce(jsonb_object_agg(game_key,jsonb_build_object('maintenance',maintenance,'live',live_enabled,'duel',duel_enabled)),'{}'::jsonb) into v_status from public.blinders_game_status;
  select jsonb_build_object('title',title,'youtubeUrl',youtube_url,'active',active) into v_radio from public.blinders_radio where id=1;
  return jsonb_build_object('ok',true,'member',jsonb_build_object('nick',v_member.nick,'iris',v_member.iris_id,'friendCode',v_member.friend_code,'role',v_member.role,'level',v_member.level),'balance',v_member.balance,'locked',v_member.locked,'vipPoints',v_member.vip_points,'transactions',v_tx,'ranking',v_rank,'gameStatus',v_status,'radio',v_radio);
end;
$$;

create or replace function public.app_deposit(p_token text,p_amount numeric,p_reference text default '') returns jsonb language plpgsql security definer set search_path=public as $$ declare v_member uuid; begin if p_amount<=0 then raise exception 'Valor inválido.'; end if; v_member:=public.app_current(p_token); update public.blinders_members set balance=balance+p_amount,vip_points=vip_points+greatest(1,round(p_amount)::int) where id=v_member; perform public.app_tx(v_member,'deposit',p_amount,'Depósito: '||coalesce(p_reference,''),'approved','{}'); return jsonb_build_object('ok',true,'message','Depósito registrado.'); end; $$;
create or replace function public.app_withdraw(p_token text,p_amount numeric,p_destination text default '') returns jsonb language plpgsql security definer set search_path=public as $$ declare v_member uuid; v_balance numeric; begin if p_amount<=0 then raise exception 'Valor inválido.'; end if; v_member:=public.app_current(p_token); select balance into v_balance from public.blinders_members where id=v_member; if p_amount>v_balance then raise exception 'Saldo insuficiente.'; end if; update public.blinders_members set balance=balance-p_amount,locked=locked+p_amount where id=v_member; perform public.app_tx(v_member,'withdraw',p_amount,'Saque: '||coalesce(p_destination,''),'pending','{}'); return jsonb_build_object('ok',true,'message','Saque solicitado.'); end; $$;
create or replace function public.app_transfer(p_token text,p_to text,p_amount numeric) returns jsonb language plpgsql security definer set search_path=public as $$ declare v_sender uuid; v_receiver public.blinders_members; v_balance numeric; begin if p_amount<=0 then raise exception 'Valor inválido.'; end if; v_sender:=public.app_current(p_token); select balance into v_balance from public.blinders_members where id=v_sender; if p_amount>v_balance then raise exception 'Saldo insuficiente.'; end if; select * into v_receiver from public.blinders_members where lower(nick)=lower(p_to) or lower(iris_id)=lower(p_to) or lower(friend_code)=lower(p_to) limit 1; if v_receiver.id is null then raise exception 'Membro destino não encontrado.'; end if; if v_receiver.id=v_sender then raise exception 'Não transfira para si mesmo.'; end if; update public.blinders_members set balance=balance-p_amount where id=v_sender; update public.blinders_members set balance=balance+p_amount where id=v_receiver.id; perform public.app_tx(v_sender,'transfer',-p_amount,'Transferência enviada para '||v_receiver.nick,'completed','{}'); perform public.app_tx(v_receiver.id,'transfer_in',p_amount,'Transferência recebida','completed','{}'); return jsonb_build_object('ok',true,'message','Transferência enviada.'); end; $$;
create or replace function public.app_play_game(p_token text,p_game text,p_bet numeric,p_choice text default '',p_payload jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path=public as $$ declare v_member uuid; v_balance numeric; v_maint boolean; v_win boolean; v_payout numeric; begin if p_bet<=0 then raise exception 'Aposta inválida.'; end if; select maintenance into v_maint from public.blinders_game_status where game_key=p_game; if coalesce(v_maint,false) then raise exception 'Jogo em manutenção.'; end if; v_member:=public.app_current(p_token); select balance into v_balance from public.blinders_members where id=v_member; if p_bet>v_balance then raise exception 'Saldo insuficiente.'; end if; v_win := coalesce((p_payload->>'win')::boolean,false); v_payout := coalesce((p_payload->>'payout')::numeric,0); update public.blinders_members set balance=balance-p_bet+v_payout,xp=xp+p_bet,level=greatest(level,1+floor((xp+p_bet)/1000)::int) where id=v_member; insert into public.blinders_game_rounds(member_id,game_key,bet,payout,win,result) values(v_member,p_game,p_bet,v_payout,v_win,p_payload); perform public.app_tx(v_member,case when v_win then 'game_win' else 'game_loss' end,v_payout-p_bet,p_game||': '||coalesce(p_payload->>'message','Rodada'),'completed',p_payload); return jsonb_build_object('ok',true,'message','Rodada registrada.','result',p_payload); end; $$;
create or replace function public.app_buy_item(p_token text,p_item_key text) returns jsonb language plpgsql security definer set search_path=public as $$ declare v_member uuid; v_item public.blinders_shop_items; v_balance numeric; begin v_member:=public.app_current(p_token); select * into v_item from public.blinders_shop_items where item_key=p_item_key and active=true; if v_item.item_key is null then raise exception 'Item não encontrado.'; end if; select balance into v_balance from public.blinders_members where id=v_member; if v_item.price>v_balance then raise exception 'Saldo insuficiente.'; end if; update public.blinders_members set balance=balance-v_item.price where id=v_member; insert into public.blinders_inventory(member_id,item_key,item_name,price) values(v_member,v_item.item_key,v_item.title,v_item.price); perform public.app_tx(v_member,'shop',-v_item.price,'Compra: '||v_item.title,'completed','{}'); return jsonb_build_object('ok',true,'message','Item comprado.'); end; $$;
create or replace function public.app_admin_set_item_price(p_token text,p_item_key text,p_price numeric) returns jsonb language plpgsql security definer set search_path=public as $$ declare v_member uuid; begin v_member:=public.app_current(p_token); if not public.app_is_admin(v_member) then raise exception 'Admin negado.'; end if; update public.blinders_shop_items set price=p_price where item_key=p_item_key; return jsonb_build_object('ok',true,'message','Preço atualizado.'); end; $$;
create or replace function public.app_admin_set_game_maintenance(p_token text,p_game text,p_locked boolean) returns jsonb language plpgsql security definer set search_path=public as $$ declare v_member uuid; begin v_member:=public.app_current(p_token); if not public.app_is_admin(v_member) then raise exception 'Admin negado.'; end if; update public.blinders_game_status set maintenance=p_locked,updated_at=now() where game_key=p_game; return jsonb_build_object('ok',true,'message','Manutenção atualizada.'); end; $$;
create or replace function public.app_admin_set_radio(p_token text,p_youtube_url text,p_title text) returns jsonb language plpgsql security definer set search_path=public as $$ declare v_member uuid; begin v_member:=public.app_current(p_token); if not public.app_is_admin(v_member) then raise exception 'Admin negado.'; end if; insert into public.blinders_radio(id,title,youtube_url,active,updated_at) values(1,coalesce(p_title,''),coalesce(p_youtube_url,''),true,now()) on conflict(id) do update set title=excluded.title,youtube_url=excluded.youtube_url,active=true,updated_at=now(); return jsonb_build_object('ok',true,'message','Rádio atualizada.'); end; $$;
create or replace function public.app_radio_now(p_token text) returns jsonb language plpgsql security definer set search_path=public as $$ declare v_member uuid; v_radio jsonb; begin v_member:=public.app_current(p_token); select jsonb_build_object('title',title,'youtubeUrl',youtube_url,'active',active) into v_radio from public.blinders_radio where id=1; return jsonb_build_object('ok',true,'radio',v_radio); end; $$;
create or replace function public.app_admin_bonus(p_token text,p_amount numeric) returns jsonb language plpgsql security definer set search_path=public as $$ declare v_member uuid; begin v_member:=public.app_current(p_token); if not public.app_is_admin(v_member) then raise exception 'Admin negado.'; end if; update public.blinders_members set balance=balance+p_amount where id=v_member; perform public.app_tx(v_member,'admin_bonus',p_amount,'Bônus admin','completed','{}'); return jsonb_build_object('ok',true,'message','Bônus aplicado.'); end; $$;
create or replace function public.app_create_family(p_token text,p_name text,p_kind text) returns jsonb language plpgsql security definer set search_path=public as $$ declare v_member uuid; begin v_member:=public.app_current(p_token); insert into public.blinders_families(name,kind,owner_id,power) values(p_name,case when p_kind='mafia' then 'mafia' else 'family' end,v_member,100); perform public.app_tx(v_member,'family',0,'Criou grupo: '||p_name,'completed','{}'); return jsonb_build_object('ok',true,'message','Grupo criado.'); end; $$;
create or replace function public.app_start_travel(p_token text,p_to_key text,p_item_key text default '') returns jsonb language plpgsql security definer set search_path=public as $$ declare v_member uuid; v_from text; fx numeric; fy numeric; tx numeric; ty numeric; v_speed numeric:=1; v_dist numeric; v_minutes int; begin v_member:=public.app_current(p_token); select location_key into v_from from public.blinders_members where id=v_member; select x,y into fx,fy from public.blinders_territories where territory_key=v_from; select x,y into tx,ty from public.blinders_territories where territory_key=p_to_key; if tx is null then raise exception 'Destino inválido.'; end if; if p_item_key<>'' then select coalesce(speed_multiplier,1) into v_speed from public.blinders_shop_items where item_key=p_item_key; end if; v_dist := sqrt(power(coalesce(tx,0)-coalesce(fx,0),2)+power(coalesce(ty,0)-coalesce(fy,0),2)); v_minutes := greatest(1,ceil(v_dist/40*v_speed)::int); insert into public.blinders_travels(member_id,from_key,to_key,item_key,arrives_at) values(v_member,v_from,p_to_key,p_item_key,now()+(v_minutes||' minutes')::interval); return jsonb_build_object('ok',true,'message','Viagem iniciada. Chegada em '||v_minutes||' min.'); end; $$;
create or replace function public.app_attack_territory(p_token text,p_territory_key text) returns jsonb language plpgsql security definer set search_path=public as $$ declare v_member uuid; v_power numeric; begin v_member:=public.app_current(p_token); select balance/100 + level*10 into v_power from public.blinders_members where id=v_member; update public.blinders_territories set defense=greatest(0,defense-v_power) where territory_key=p_territory_key; perform public.app_tx(v_member,'attack',0,'Ataque ao território '||p_territory_key,'completed',jsonb_build_object('power',v_power)); return jsonb_build_object('ok',true,'message','Ataque registrado com força '||round(v_power)::text||'.'); end; $$;
create or replace function public.app_marriage_request(p_token text,p_target text) returns jsonb language plpgsql security definer set search_path=public as $$ declare v_member uuid; v_target uuid; begin v_member:=public.app_current(p_token); select id into v_target from public.blinders_members where lower(nick)=lower(p_target) or lower(iris_id)=lower(p_target) limit 1; if v_target is null then raise exception 'Membro não encontrado.'; end if; insert into public.blinders_marriages(requester_id,target_id,status) values(v_member,v_target,'pending'); return jsonb_build_object('ok',true,'message','Pedido de casamento enviado.'); end; $$;

grant execute on function public.app_guest_session(text) to anon, authenticated;
grant execute on function public.app_wallet(text) to anon, authenticated;
grant execute on function public.app_deposit(text,numeric,text) to anon, authenticated;
grant execute on function public.app_withdraw(text,numeric,text) to anon, authenticated;
grant execute on function public.app_transfer(text,text,numeric) to anon, authenticated;
grant execute on function public.app_play_game(text,text,numeric,text,jsonb) to anon, authenticated;
grant execute on function public.app_buy_item(text,text) to anon, authenticated;
grant execute on function public.app_admin_set_item_price(text,text,numeric) to anon, authenticated;
grant execute on function public.app_admin_set_game_maintenance(text,text,boolean) to anon, authenticated;
grant execute on function public.app_admin_set_radio(text,text,text) to anon, authenticated;
grant execute on function public.app_radio_now(text) to anon, authenticated;
grant execute on function public.app_admin_bonus(text,numeric) to anon, authenticated;
grant execute on function public.app_create_family(text,text,text) to anon, authenticated;
grant execute on function public.app_start_travel(text,text,text) to anon, authenticated;
grant execute on function public.app_attack_territory(text,text) to anon, authenticated;
grant execute on function public.app_marriage_request(text,text) to anon, authenticated;

select public.app_seed();
notify pgrst, 'reload schema';
select 'BLINDERS_RELEASE_LAUNCH_SQL_V2_OK' as status;
