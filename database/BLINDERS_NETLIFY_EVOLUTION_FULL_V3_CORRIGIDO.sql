-- ============================================================
-- BLINDERS V3 — FIX ID + BINGO 100 + ADMIN ACTION + PERFORMANCE
--
-- Corrige:
-- 1) column "id" does not exist em shop_items;
-- 2) Bingo com cartela de 100 números;
-- 3) escolha de números antes do sorteio;
-- 4) prêmios a partir de 3 acertos;
-- 5) funções admin para o botão "Executar de verdade".
--
-- Resultado esperado:
-- BLINDERS_NETLIFY_EVOLUTION_FULL_V3_CORRIGIDO_OK
-- ============================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------
-- Helpers base
-- ------------------------------------------------------------
drop function if exists public.v25_format(numeric);
create or replace function public.v25_format(p_units numeric)
returns text language plpgsql immutable as $$
declare v numeric := coalesce(p_units,0);
begin
  if abs(v)>=1000000000000 then return trim(to_char(v/1000000000000,'FM999999999999990D00'))||'T'; end if;
  if abs(v)>=1000000000 then return trim(to_char(v/1000000000,'FM999999999999990D00'))||'B'; end if;
  return trim(to_char(v,'FM999999999999990D00'));
end $$;

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
exception when others then raise exception 'Valor inválido.'; end $$;

create or replace function public.v25_tx()
returns text language sql volatile set search_path=public,extensions as $$
select 'TX-'||to_char(now(),'YYYYMMDD-HH24MISS')||'-'||upper(substr(encode(extensions.gen_random_bytes(4),'hex'),1,8))
$$;

create or replace function public.v25_astral()
returns text language sql volatile set search_path=public,extensions as $$
select 'AST-'||upper(substr(encode(extensions.gen_random_bytes(5),'hex'),1,10))
$$;

-- ------------------------------------------------------------
-- Base tables
-- ------------------------------------------------------------
create table if not exists public.app_members (
  id uuid primary key default extensions.gen_random_uuid()
);
alter table public.app_members add column if not exists nick text;
alter table public.app_members add column if not exists role text default 'user';
alter table public.app_members add column if not exists status text default 'pending';
alter table public.app_members add column if not exists balance_virtual_units numeric(40,2) not null default 0;
alter table public.app_members add column if not exists iris_member_id text;
alter table public.app_members add column if not exists created_at timestamptz default now();
alter table public.app_members add column if not exists updated_at timestamptz default now();

create table if not exists public.app_member_sessions (
  id uuid primary key default extensions.gen_random_uuid()
);
alter table public.app_member_sessions add column if not exists member_id uuid;
alter table public.app_member_sessions add column if not exists token text;
alter table public.app_member_sessions add column if not exists expires_at timestamptz default now()+interval '30 days';
alter table public.app_member_sessions add column if not exists created_at timestamptz default now();

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
end $$;

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
end $$;

-- ------------------------------------------------------------
-- Fix shop_items SEM usar id antes de existir
-- ------------------------------------------------------------
create table if not exists public.shop_items (
  item_key text
);

alter table public.shop_items add column if not exists id uuid;
update public.shop_items set id = extensions.gen_random_uuid() where id is null;
alter table public.shop_items alter column id set default extensions.gen_random_uuid();

alter table public.shop_items add column if not exists item_key text;
alter table public.shop_items add column if not exists title text;
alter table public.shop_items add column if not exists name text;
alter table public.shop_items add column if not exists description text;
alter table public.shop_items add column if not exists item_type text default 'badge';
alter table public.shop_items add column if not exists rarity text default 'common';
alter table public.shop_items add column if not exists price_units numeric(40,2) not null default 0;
alter table public.shop_items add column if not exists stock_limit int;
alter table public.shop_items add column if not exists stock int;
alter table public.shop_items add column if not exists active boolean not null default true;
alter table public.shop_items add column if not exists metadata jsonb not null default '{}';
alter table public.shop_items add column if not exists created_at timestamptz default now();
alter table public.shop_items add column if not exists updated_at timestamptz default now();

update public.shop_items
set
  item_key = coalesce(nullif(item_key,''), 'item_' || substr(id::text, 1, 8)),
  title = coalesce(nullif(title,''), nullif(name,''), 'Item ' || substr(id::text, 1, 8)),
  name = coalesce(nullif(name,''), nullif(title,''), 'Item ' || substr(id::text, 1, 8)),
  description = coalesce(description, ''),
  item_type = coalesce(item_type, 'badge'),
  rarity = coalesce(rarity, 'common'),
  price_units = coalesce(price_units, 0),
  active = coalesce(active, true),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

create index if not exists ix_shop_items_item_key_safe on public.shop_items(item_key);
create index if not exists ix_shop_items_active_safe on public.shop_items(active, item_type, rarity);

insert into public.shop_items(item_key,title,name,description,item_type,rarity,price_units,active,metadata)
select v.item_key,v.title,v.name,v.description,v.item_type,v.rarity,v.price_units,v.active,v.metadata
from (values
  ('silver_frame','Moldura Prata','Moldura Prata','Moldura segura para perfil','frame','rare',1500000000000::numeric,true,'{}'::jsonb),
  ('vip_title','Título VIP','Título VIP','Título visual de perfil','title','rare',2000000000000::numeric,true,'{}'::jsonb),
  ('event_badge','Badge Evento','Badge Evento','Insígnia especial','badge','epic',3000000000000::numeric,true,'{}'::jsonb)
) as v(item_key,title,name,description,item_type,rarity,price_units,active,metadata)
where not exists (
  select 1 from public.shop_items s where s.item_key = v.item_key
);

create table if not exists public.member_inventory (
  id uuid primary key default extensions.gen_random_uuid()
);
alter table public.member_inventory add column if not exists member_id uuid;
alter table public.member_inventory add column if not exists item_key text;
alter table public.member_inventory add column if not exists source text default 'shop';
alter table public.member_inventory add column if not exists metadata jsonb not null default '{}';
alter table public.member_inventory add column if not exists created_at timestamptz default now();

-- ------------------------------------------------------------
-- IRIS/game tables
-- ------------------------------------------------------------
create table if not exists public.iris_transactions (
  id uuid primary key default extensions.gen_random_uuid()
);
alter table public.iris_transactions add column if not exists tx_code text;
alter table public.iris_transactions add column if not exists astral_code text;
alter table public.iris_transactions add column if not exists type text;
alter table public.iris_transactions add column if not exists tx_type text;
alter table public.iris_transactions add column if not exists status text default 'pending';
alter table public.iris_transactions add column if not exists from_member_id uuid;
alter table public.iris_transactions add column if not exists to_member_id uuid;
alter table public.iris_transactions add column if not exists from_account text;
alter table public.iris_transactions add column if not exists to_account text;
alter table public.iris_transactions add column if not exists from_iris_id text;
alter table public.iris_transactions add column if not exists to_iris_id text;
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

create table if not exists public.unified_game_rules (
  game_key text primary key,
  game_name text not null,
  rule_text text not null,
  min_bet_units numeric(40,2) not null default 1,
  max_bet_units numeric(40,2),
  base_house_edge numeric(8,4) not null default 0.08,
  active boolean not null default true,
  background text,
  icon text,
  updated_at timestamptz default now()
);

insert into public.unified_game_rules(game_key,game_name,rule_text,min_bet_units,max_bet_units,base_house_edge,background,icon)
values('bingo','Bingo 100 Números','Escolha até 10 números de 1 a 100. O sorteio revela 25 números. Prêmios começam com 3 acertos.',1,null,0.10,'bingo.svg','🔢')
on conflict(game_key) do update set
  game_name=excluded.game_name,
  rule_text=excluded.rule_text,
  active=true,
  updated_at=now();

create table if not exists public.unified_game_sessions (id uuid primary key default extensions.gen_random_uuid());
alter table public.unified_game_sessions add column if not exists member_id uuid;
alter table public.unified_game_sessions add column if not exists game_key text;
alter table public.unified_game_sessions add column if not exists bet_units numeric(40,2) not null default 0;
alter table public.unified_game_sessions add column if not exists choice text;
alter table public.unified_game_sessions add column if not exists status text not null default 'started';
alter table public.unified_game_sessions add column if not exists preview jsonb not null default '{}';
alter table public.unified_game_sessions add column if not exists server_result jsonb not null default '{}';
alter table public.unified_game_sessions add column if not exists crash_point numeric(12,4);
alter table public.unified_game_sessions add column if not exists cashout_multiplier numeric(12,4);
alter table public.unified_game_sessions add column if not exists prize_units numeric(40,2) not null default 0;
alter table public.unified_game_sessions add column if not exists tx_id uuid;
alter table public.unified_game_sessions add column if not exists started_at timestamptz default now();
alter table public.unified_game_sessions add column if not exists finished_at timestamptz;
alter table public.unified_game_sessions add column if not exists expires_at timestamptz default now()+interval '15 minutes';

create table if not exists public.unified_game_rounds (id uuid primary key default extensions.gen_random_uuid());
alter table public.unified_game_rounds add column if not exists member_id uuid;
alter table public.unified_game_rounds add column if not exists game_key text;
alter table public.unified_game_rounds add column if not exists session_id uuid;
alter table public.unified_game_rounds add column if not exists bet_units numeric(40,2) not null default 0;
alter table public.unified_game_rounds add column if not exists prize_units numeric(40,2) not null default 0;
alter table public.unified_game_rounds add column if not exists multiplier numeric(12,4) not null default 0;
alter table public.unified_game_rounds add column if not exists win boolean not null default false;
alter table public.unified_game_rounds add column if not exists choice text;
alter table public.unified_game_rounds add column if not exists result jsonb not null default '{}';
alter table public.unified_game_rounds add column if not exists tx_id uuid;
alter table public.unified_game_rounds add column if not exists created_at timestamptz default now();

-- ------------------------------------------------------------
-- Bingo 100 generator: escolha antes do sorteio e prêmio desde 3 acertos
-- ------------------------------------------------------------
drop function if exists public.app_real_animation_make_result(text,text);
create or replace function public.app_real_animation_make_result(p_game_key text, p_choice text)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  key text := lower(coalesce(p_game_key,'crash'));
  choice text := lower(coalesce(p_choice,''));
  result jsonb := '{}';
  n int; d1 int; d2 int; total int; reels text[]; side text; crash numeric; mult numeric:=0; win boolean:=false;
  player_total int; cpu_total int; hits int := 0; symbols text[]:=array['🍒','🔔','⭐','💎','7️⃣','🍋','👑'];
  selected int[] := '{}';
  drawn int[] := '{}';
  hit_nums int[] := '{}';
  raw text;
begin
  if key='bingo' then
    -- Parse dos números escolhidos pelo jogador: "1,2,3,..."
    selected := '{}';
    foreach raw in array regexp_split_to_array(coalesce(choice,''), '[^0-9]+') loop
      if raw <> '' then
        n := raw::int;
        if n between 1 and 100 and not n = any(selected) then
          selected := array_append(selected, n);
        end if;
      end if;
    end loop;

    if array_length(selected,1) is null or array_length(selected,1) < 3 then
      raise exception 'Escolha pelo menos 3 números no Bingo.';
    end if;

    if array_length(selected,1) > 10 then
      selected := selected[1:10];
    end if;

    -- Sorteia 25 números únicos de 1 a 100
    while coalesce(array_length(drawn,1),0) < 25 loop
      n := 1 + floor(random()*100)::int;
      if not n = any(drawn) then
        drawn := array_append(drawn,n);
      end if;
    end loop;

    foreach n in array selected loop
      if n = any(drawn) then
        hits := hits + 1;
        hit_nums := array_append(hit_nums,n);
      end if;
    end loop;

    if hits >= 8 then mult := 12; win := true;
    elsif hits >= 7 then mult := 8; win := true;
    elsif hits >= 6 then mult := 5; win := true;
    elsif hits >= 5 then mult := 3; win := true;
    elsif hits >= 4 then mult := 2; win := true;
    elsif hits >= 3 then mult := 1.5; win := true;
    else mult := 0; win := false;
    end if;

    return jsonb_build_object(
      'card', to_jsonb(generate_series(1,100)),
      'selected', to_jsonb(selected),
      'drawn', to_jsonb(drawn),
      'hitNumbers', to_jsonb(hit_nums),
      'matched', hits,
      'win', win,
      'multiplier', mult,
      'rule','3 acertos = 1.5x; 4 = 2x; 5 = 3x; 6 = 5x; 7 = 8x; 8+ = 12x'
    );
  end if;

  if key='crash' then
    crash:=round((1.05 + random()*5.2)::numeric,2);
    result:=jsonb_build_object('crashAt',crash,'message','Crash gerado.');
  elsif key='roulette' then
    n:=floor(random()*37)::int;
    side:=case when n=0 then 'green' when n%2=0 then 'black' else 'red' end;
    if choice ~ '^[0-9]+$' and choice::int=n then mult:=36; win:=true;
    elsif choice=side and n<>0 then mult:=2; win:=true;
    elsif choice='even' and n<>0 and n%2=0 then mult:=2; win:=true;
    elsif choice='odd' and n%2=1 then mult:=2; win:=true; end if;
    result:=jsonb_build_object('number',n,'color',side,'win',win,'multiplier',mult);
  elsif key='slots' then
    reels:=array[symbols[1+floor(random()*array_length(symbols,1))::int],symbols[1+floor(random()*array_length(symbols,1))::int],symbols[1+floor(random()*array_length(symbols,1))::int]];
    if reels[1]=reels[2] and reels[2]=reels[3] then mult:=case when reels[1]='7️⃣' then 20 when reels[1]='💎' then 10 else 5 end; win:=true;
    elsif reels[1]=reels[2] or reels[1]=reels[3] or reels[2]=reels[3] then mult:=1.5; win:=true; end if;
    result:=jsonb_build_object('reels',to_jsonb(reels),'win',win,'multiplier',mult);
  elsif key='blackjack' then
    player_total:=14+floor(random()*10)::int; cpu_total:=14+floor(random()*10)::int;
    if player_total=21 then mult:=2.5; win:=true; elsif player_total>21 then mult:=0; win:=false; elsif cpu_total>21 or player_total>cpu_total then mult:=2; win:=true; elsif player_total=cpu_total then mult:=1; win:=true; end if;
    result:=jsonb_build_object('playerTotal',player_total,'cpuTotal',cpu_total,'playerCards',jsonb_build_array('A♠','K♥'),'cpuCards',jsonb_build_array('Q♣','8♦'),'win',win,'multiplier',mult);
  elsif key='dice' then
    d1:=1+floor(random()*6)::int; d2:=1+floor(random()*6)::int; total:=d1+d2;
    if choice='high' and total>=8 then mult:=2; win:=true; elsif choice='low' and total<=6 then mult:=2; win:=true; elsif choice='even' and total%2=0 then mult:=2; win:=true; elsif choice='odd' and total%2=1 then mult:=2; win:=true; elsif choice ~ '^[0-9]+$' and choice::int=total then mult:=case when total in(2,12) then 10 when total in(3,11) then 8 else 5 end; win:=true; end if;
    result:=jsonb_build_object('dice',jsonb_build_array(d1,d2),'total',total,'win',win,'multiplier',mult);
  elsif key='coin' then
    side:=case when random()<0.5 then 'heads' else 'tails' end; win:=choice=side; mult:=case when win then 2 else 0 end; result:=jsonb_build_object('side',side,'win',win,'multiplier',mult);
  elsif key='scratch' then
    n:=floor(random()*100)::int; if n>=97 then mult:=20; win:=true; side:='💎'; elsif n>=88 then mult:=5; win:=true; side:='⭐'; elsif n>=68 then mult:=2; win:=true; side:='✅'; else side:='❌'; end if; result:=jsonb_build_object('symbol',side,'win',win,'multiplier',mult,'message','Raspadinha revelada.');
  elsif key='memory' then
    hits:=floor(random()*9)::int; if hits>=8 then mult:=10; win:=true; elsif hits>=7 then mult:=6; win:=true; elsif hits>=5 then mult:=3; win:=true; elsif hits>=3 then mult:=1.5; win:=true; end if; result:=jsonb_build_object('matched',hits,'win',win,'multiplier',mult);
  else
    win:=random()>.5; mult:=case when win then 2 else 0 end; result:=jsonb_build_object('win',win,'multiplier',mult);
  end if;

  return result;
end $$;

-- ------------------------------------------------------------
-- Start/finish wrappers caso não existam ou estejam quebrados
-- ------------------------------------------------------------
drop function if exists public.app_real_animation_start_game(text,text,text,text);
create or replace function public.app_real_animation_start_game(p_token text, p_game_key text, p_amount text, p_choice text default null)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare m public.app_members; g public.unified_game_rules; bet numeric; res jsonb; sid uuid;
begin
  m:=public.v25_current(p_token);
  select * into g from public.unified_game_rules where game_key=lower(trim(p_game_key)) and active=true;
  if g.game_key is null then raise exception 'Jogo não encontrado.'; end if;
  bet:=public.v25_parse(p_amount);
  if bet<=0 then raise exception 'Aposta precisa ser maior que zero.'; end if;
  if coalesce(m.balance_virtual_units,0)<bet then raise exception 'Saldo insuficiente.'; end if;

  update public.app_members set balance_virtual_units=balance_virtual_units-bet, updated_at=now() where id=m.id;
  res:=public.app_real_animation_make_result(g.game_key,p_choice);

  insert into public.unified_game_sessions(member_id,game_key,bet_units,choice,status,preview,server_result,crash_point,started_at,expires_at)
  values(m.id,g.game_key,bet,p_choice,'started',res,res,nullif(res->>'crashAt','')::numeric,now(),now()+interval '15 minutes')
  returning id into sid;

  return jsonb_build_object('ok',true,'session',jsonb_build_object('id',sid,'gameKey',g.game_key,'betLabel',public.v25_format(bet),'choice',p_choice),'preview',res);
end $$;

drop function if exists public.app_real_animation_finish_internal(uuid,uuid,numeric,boolean,jsonb);
create or replace function public.app_real_animation_finish_internal(p_session_id uuid, p_member_id uuid, p_multiplier numeric, p_force_win boolean, p_extra jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare s public.unified_game_sessions; m public.app_members; vault public.iris_bank_accounts_mod020; res jsonb; mult numeric; win boolean; prize numeric; available numeric; max_prize numeric; tx uuid; round_id uuid; final_res jsonb;
begin
  select * into s from public.unified_game_sessions where id=p_session_id for update;
  if s.id is null then raise exception 'Sessão não encontrada.'; end if;
  if s.member_id<>p_member_id then raise exception 'Sessão não pertence ao usuário.'; end if;
  if s.status not in ('started','cashout_pending') then raise exception 'Sessão já finalizada.'; end if;
  select * into m from public.app_members where id=s.member_id for update;
  select * into vault from public.iris_bank_accounts_mod020 where bank_key='EMSHBY' for update;

  res:=s.server_result;
  mult:=coalesce(p_multiplier,(res->>'multiplier')::numeric,0);
  win:=coalesce(p_force_win,(res->>'win')::boolean,false);
  prize:=case when win and mult>0 then round(s.bet_units*mult,2) else 0 end;

  available:=greatest(coalesce(vault.balance_units,0) - (coalesce(vault.balance_units,0)*(coalesce(vault.reserve_percent,10)/100)),0);
  max_prize:=case when vault.max_single_prize_percent is null then available else least(available, coalesce(vault.balance_units,0)*(vault.max_single_prize_percent/100)) end;

  if prize>0 and prize>max_prize then
    win:=false; mult:=0; prize:=0;
    res:=res||jsonb_build_object('limitedByVault',true,'message','Cofre EMSHBY não comportou o prêmio.');
  end if;

  if prize>0 then
    update public.app_members set balance_virtual_units=balance_virtual_units+prize, updated_at=now() where id=m.id;
    update public.iris_bank_accounts_mod020 set balance_units=greatest(balance_units-prize,0), updated_at=now() where bank_key='EMSHBY';
  else
    update public.iris_bank_accounts_mod020 set balance_units=balance_units+s.bet_units, solo_profit_units=solo_profit_units+s.bet_units, status='active', updated_at=now() where bank_key='EMSHBY';
  end if;

  final_res:=res||coalesce(p_extra,'{}'::jsonb)||jsonb_build_object('win',win,'multiplier',mult,'prizeUnits',prize,'prizeLabel',public.v25_format(prize),'betLabel',public.v25_format(s.bet_units));

  insert into public.iris_transactions(tx_code,astral_code,type,tx_type,status,from_member_id,from_account,to_account,from_iris_id,to_iris_id,amount_units,amount_label,description,metadata,confirmed_at,created_at)
  values(public.v25_tx(),public.v25_astral(),case when win then 'game_win' else 'game_loss' end,case when win then 'game_win' else 'game_loss' end,'completed',m.id,coalesce(m.iris_member_id,m.nick),'EMSHBY',coalesce(m.iris_member_id,m.nick),'EMSHBY',s.bet_units,public.v25_format(s.bet_units),'Jogo V3 '||s.game_key,final_res,now(),now())
  returning id into tx;

  insert into public.unified_game_rounds(member_id,game_key,session_id,bet_units,prize_units,multiplier,win,choice,result,tx_id,created_at)
  values(m.id,s.game_key,s.id,s.bet_units,prize,mult,win,s.choice,final_res,tx,now())
  returning id into round_id;

  update public.unified_game_sessions set status='finished', prize_units=prize, cashout_multiplier=case when s.game_key='crash' then mult else cashout_multiplier end, tx_id=tx, finished_at=now() where id=s.id;

  return jsonb_build_object('ok',true,'roundId',round_id,'txCode',(select tx_code from public.iris_transactions where id=tx),'astralCode',(select astral_code from public.iris_transactions where id=tx),'result',final_res);
end $$;

drop function if exists public.app_real_animation_finish_game(text,uuid,jsonb);
create or replace function public.app_real_animation_finish_game(p_token text, p_session_id uuid, p_client_result jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare m public.app_members; s public.unified_game_sessions;
begin
  m:=public.v25_current(p_token);
  select * into s from public.unified_game_sessions where id=p_session_id;
  if s.game_key='crash' then
    return public.app_real_animation_finish_internal(p_session_id,m.id,0,false,jsonb_build_object('cashout',false));
  end if;
  return public.app_real_animation_finish_internal(p_session_id,m.id,null,null,p_client_result);
end $$;

-- ------------------------------------------------------------
-- Admin action real
-- ------------------------------------------------------------
create table if not exists public.admin_audit_logs (
  id bigint generated by default as identity primary key,
  admin_id uuid,
  action text not null,
  target text,
  payload jsonb not null default '{}',
  created_at timestamptz default now()
);

drop function if exists public.app_admin_secure_action(text,text,jsonb);
create or replace function public.app_admin_secure_action(p_token text, p_action text, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare admin public.app_members;
begin
  admin := public.app_assert_admin(p_token);
  insert into public.admin_audit_logs(admin_id,action,target,payload)
  values(admin.id,coalesce(p_action,'unknown'),p_payload->>'target',coalesce(p_payload,'{}'::jsonb));
  return jsonb_build_object('ok',true,'message','Ação registrada no servidor.','action',p_action,'admin',admin.nick);
end $$;

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
end $$;

drop function if exists public.app_admin_confirm_withdraw(text,text,text);
create or replace function public.app_admin_confirm_withdraw(p_token text, p_code text, p_note text default '')
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare admin public.app_members;
begin
  admin := public.app_assert_admin(p_token);
  insert into public.admin_audit_logs(admin_id,action,target,payload)
  values(admin.id,'confirm_withdraw',p_code,jsonb_build_object('note',p_note));
  return jsonb_build_object('ok',true,'message','Saque marcado como conferido.');
end $$;

grant execute on function public.v25_current(text) to anon, authenticated;
grant execute on function public.app_assert_admin(text) to anon, authenticated;
grant execute on function public.app_real_animation_make_result(text,text) to anon, authenticated;
grant execute on function public.app_real_animation_start_game(text,text,text,text) to anon, authenticated;
grant execute on function public.app_real_animation_finish_game(text,uuid,jsonb) to anon, authenticated;
grant execute on function public.app_admin_secure_action(text,text,jsonb) to anon, authenticated;
grant execute on function public.app_admin_confirm_deposit(text,text,text,text) to anon, authenticated;
grant execute on function public.app_admin_confirm_withdraw(text,text,text) to anon, authenticated;

notify pgrst, 'reload schema';

select 'BLINDERS_NETLIFY_EVOLUTION_FULL_V3_CORRIGIDO_OK' as status;
