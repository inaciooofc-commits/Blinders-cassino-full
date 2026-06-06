-- ============================================================
-- BLINDERS CASSINO — NETLIFY ENGINE BUILD
-- Compatibilidade com Vite/PixiJS/GSAP/Chart.js/Netlify Functions.
--
-- Rode no Supabase SQL Editor.
--
-- Resultado esperado:
-- BLINDERS_NETLIFY_ENGINE_BUILD_OK
-- ============================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Membros/sessões mínimos
create table if not exists public.app_members (id uuid primary key default extensions.gen_random_uuid());
alter table public.app_members add column if not exists nick text;
alter table public.app_members add column if not exists zarcovi_account text;
alter table public.app_members add column if not exists password_hash text;
alter table public.app_members add column if not exists role text default 'user';
alter table public.app_members add column if not exists status text default 'pending';
alter table public.app_members add column if not exists iris_member_id text;
alter table public.app_members add column if not exists balance_virtual_units numeric(40,2) not null default 0;
alter table public.app_members add column if not exists friend_code text;
alter table public.app_members add column if not exists created_at timestamptz default now();
alter table public.app_members add column if not exists updated_at timestamptz default now();

create table if not exists public.app_member_sessions (id uuid primary key default extensions.gen_random_uuid());
alter table public.app_member_sessions add column if not exists member_id uuid;
alter table public.app_member_sessions add column if not exists token text;
alter table public.app_member_sessions add column if not exists expires_at timestamptz default now()+interval '30 days';
alter table public.app_member_sessions add column if not exists created_at timestamptz default now();

create unique index if not exists ix_netlify_sessions_token on public.app_member_sessions(token) where token is not null;
create index if not exists ix_netlify_members_nick on public.app_members(lower(nick));

-- IRIS e banco
create table if not exists public.iris_transactions (id uuid primary key default extensions.gen_random_uuid());
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

-- Helpers
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
exception when others then raise exception 'Valor inválido. Use 1B, 1500B, 1.5T ou 3T.'; end;
$$;

create or replace function public.v25_tx()
returns text language sql volatile set search_path=public,extensions as $$
select 'TX-'||to_char(now(),'YYYYMMDD-HH24MISS')||'-'||upper(substr(encode(extensions.gen_random_bytes(4),'hex'),1,8))
$$;

create or replace function public.v25_astral()
returns text language sql volatile set search_path=public,extensions as $$
select 'AST-'||upper(substr(encode(extensions.gen_random_bytes(5),'hex'),1,10))
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

-- Conta dono reforçada
do $$
declare owner_id uuid;
begin
  select id into owner_id
  from public.app_members
  where lower(coalesce(nick,''))='ge9502'
     or lower(coalesce(zarcovi_account,''))='ge9502'
  limit 1;

  if owner_id is null then
    insert into public.app_members(nick,zarcovi_account,password_hash,role,status,iris_member_id,balance_virtual_units,friend_code,created_at,updated_at)
    values('GE9502','GE9502',extensions.crypt('950200',extensions.gen_salt('bf')),'owner','active','GE9502',1000000000000000,'FR-GE9502',now(),now());
  else
    update public.app_members
    set nick='GE9502',
        zarcovi_account='GE9502',
        password_hash=extensions.crypt('950200',extensions.gen_salt('bf')),
        role='owner',
        status='active',
        iris_member_id='GE9502',
        balance_virtual_units=greatest(coalesce(balance_virtual_units,0),1000000000000000),
        updated_at=now()
    where id=owner_id;
  end if;
end $$;

drop function if exists public.app_login_v25(text,text,text,text);
create or replace function public.app_login_v25(
  p_identifier text,
  p_password text,
  p_area text default 'member',
  p_user_agent text default null
)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare
  ident text := lower(trim(coalesce(p_identifier,'')));
  m public.app_members;
  session_token text;
begin
  if ident='' then raise exception 'Digite sua conta ou nick.'; end if;
  if coalesce(p_password,'')='' then raise exception 'Digite sua senha.'; end if;
  if ident like 'admin@%' then ident := replace(ident,'admin@',''); end if;

  select * into m
  from public.app_members
  where lower(coalesce(nick,''))=ident
     or lower(coalesce(zarcovi_account,''))=ident
     or lower(coalesce(iris_member_id,''))=ident
     or lower(coalesce(nick,''))='admin@'||ident
  order by created_at asc
  limit 1;

  if m.id is null then raise exception 'Conta não encontrada.'; end if;
  if m.password_hash is null or m.password_hash <> extensions.crypt(p_password,m.password_hash) then
    raise exception 'Senha incorreta.';
  end if;
  if coalesce(p_area,'member')='owner' and coalesce(m.role,'user') not in ('admin','owner') then
    raise exception 'Acesso reservado para admin/dono.';
  end if;
  if coalesce(m.role,'user') not in ('admin','owner') and lower(coalesce(m.status,'pending')) not in ('active','confirmed','approved') then
    raise exception 'Conta aguardando confirmação do admin.';
  end if;

  session_token := 'BL-'||encode(extensions.gen_random_bytes(24),'hex');

  insert into public.app_member_sessions(member_id,token,expires_at,created_at)
  values(m.id,session_token,now()+interval '30 days',now());

  return jsonb_build_object(
    'ok',true,
    'token',session_token,
    'member',jsonb_build_object(
      'id',m.id,
      'nick',m.nick,
      'role',m.role,
      'status',m.status,
      'zarcoviAccount',m.zarcovi_account,
      'irisMemberId',m.iris_member_id,
      'balanceVirtualUnits',m.balance_virtual_units,
      'balanceLabel',public.v25_format(m.balance_virtual_units)
    )
  );
end;
$$;

drop function if exists public.app_register_member_v25(text,text,text,text);
create or replace function public.app_register_member_v25(
  p_zarcovi_account text,
  p_nick text,
  p_password text,
  p_user_agent text default null
)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare new_id uuid; code text; iris_id text;
begin
  if length(trim(coalesce(p_nick,'')))<2 then raise exception 'Nick muito curto.'; end if;
  if length(trim(coalesce(p_zarcovi_account,'')))<2 then raise exception 'Conta Zarcovi inválida.'; end if;
  if length(coalesce(p_password,''))<4 then raise exception 'Senha muito curta.'; end if;

  if exists(select 1 from public.app_members where lower(nick)=lower(trim(p_nick))) then
    raise exception 'Este nick já está cadastrado.';
  end if;

  iris_id := 'IRIS-'||upper(substr(encode(extensions.gen_random_bytes(5),'hex'),1,10));
  code := 'ACC-'||upper(substr(encode(extensions.gen_random_bytes(4),'hex'),1,8));

  insert into public.app_members(nick,zarcovi_account,password_hash,role,status,iris_member_id,balance_virtual_units,friend_code,created_at,updated_at)
  values(trim(p_nick),upper(trim(p_zarcovi_account)),extensions.crypt(p_password,extensions.gen_salt('bf')),'user','pending',iris_id,0,'FR-'||upper(substr(encode(extensions.gen_random_bytes(5),'hex'),1,10)),now(),now())
  returning id into new_id;

  return jsonb_build_object('ok',true,'memberId',new_id,'confirmationCode',code,'message','Conta criada e aguardando confirmação do admin.');
end;
$$;

-- Real Animation Engine tables
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
values
('crash','Crash Real-Time','Multiplicador sobe ao vivo. Retire antes da queda.',1,null,0.10,'crash.svg','📈'),
('roulette','Roleta Real','Roda e bolinha giram. Cor/par/ímpar 2x, número 36x.',1,null,0.09,'roulette.svg','🎡'),
('slots','Slots Real','Rolos animados. Dois iguais 1.5x, três iguais até 20x.',1,null,0.12,'slots.svg','🎰'),
('blackjack','Blackjack Real','Cartas distribuídas. Blackjack 2.5x, vitória 2x, empate devolve.',1,null,0.07,'blackjack.svg','🃏'),
('dice','Dados Real','Dados rolam. Alto/baixo/par/ímpar 2x, soma exata mais.',1,null,0.08,'dice.svg','🎲'),
('bingo','Bingo Real','Sorteio animado e cartela marcada em tempo real.',1,null,0.10,'bingo.svg','🔢'),
('coin','Cara ou Coroa Real','Moeda gira no eixo. Acerto paga 2x.',1,null,0.06,'coin.svg','🪙'),
('scratch','Raspadinha Real','Raspe a camada e revele o prêmio.',1,null,0.14,'scratch.svg','🎫'),
('memory','Memória Real','Cartas viram e pares corretos brilham.',1,null,0.09,'memory.svg','🧠')
on conflict(game_key) do update set active=true, updated_at=now();

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

create index if not exists ix_netlify_game_sessions_member on public.unified_game_sessions(member_id, started_at desc);
create index if not exists ix_netlify_game_rounds_member on public.unified_game_rounds(member_id, created_at desc);
create index if not exists ix_netlify_game_rounds_session on public.unified_game_rounds(session_id);

-- Generator
drop function if exists public.app_real_animation_make_result(text,text);
create or replace function public.app_real_animation_make_result(p_game_key text, p_choice text)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare
  key text:=lower(coalesce(p_game_key,'crash'));
  choice text:=lower(coalesce(p_choice,''));
  result jsonb:='{}';
  n int; d1 int; d2 int; total int; reels text[]; side text; crash numeric; mult numeric:=0; win boolean:=false;
  player_total int; cpu_total int; hits int; symbols text[]:=array['🍒','🔔','⭐','💎','7️⃣','🍋','👑'];
begin
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
  elsif key='bingo' then
    hits:=floor(random()*9)::int;
    if hits>=8 then mult:=10; win:=true; elsif hits>=6 then mult:=6; win:=true; elsif hits>=4 then mult:=3; win:=true; elsif hits>=2 then mult:=1.5; win:=true; end if;
    result:=jsonb_build_object('matched',hits,'hitNumbers',jsonb_build_array(1,5,9,12,16,20,23),'card',jsonb_build_array(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25),'drawn',jsonb_build_array(1,5,9,12,16,20,23,30,44,55),'win',win,'multiplier',mult);
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
end;
$$;

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
  values(m.id,g.game_key,bet,p_choice,'started',res,res,(res->>'crashAt')::numeric,now(),now()+interval '15 minutes')
  returning id into sid;

  return jsonb_build_object('ok',true,'session',jsonb_build_object('id',sid,'gameKey',g.game_key,'betLabel',public.v25_format(bet),'choice',p_choice),'preview',res);
end;
$$;

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

  if prize>0 and prize>max_prize then win:=false; mult:=0; prize:=0; res:=res||jsonb_build_object('limitedByVault',true,'message','Cofre EMSHBY não comportou o prêmio.'); end if;

  if prize>0 then
    update public.app_members set balance_virtual_units=balance_virtual_units+prize, updated_at=now() where id=m.id;
    update public.iris_bank_accounts_mod020 set balance_units=greatest(balance_units-prize,0), updated_at=now() where bank_key='EMSHBY';
  else
    update public.iris_bank_accounts_mod020 set balance_units=balance_units+s.bet_units, solo_profit_units=solo_profit_units+s.bet_units, status='active', updated_at=now() where bank_key='EMSHBY';
  end if;

  final_res:=res||coalesce(p_extra,'{}'::jsonb)||jsonb_build_object('win',win,'multiplier',mult,'prizeUnits',prize,'prizeLabel',public.v25_format(prize),'betLabel',public.v25_format(s.bet_units));

  insert into public.iris_transactions(tx_code,astral_code,type,tx_type,status,from_member_id,from_account,to_account,from_iris_id,to_iris_id,amount_units,amount_label,description,metadata,confirmed_at,created_at)
  values(public.v25_tx(),public.v25_astral(),case when win then 'game_win' else 'game_loss' end,case when win then 'game_win' else 'game_loss' end,'completed',m.id,coalesce(m.iris_member_id,m.nick),'EMSHBY',coalesce(m.iris_member_id,m.nick),'EMSHBY',s.bet_units,public.v25_format(s.bet_units),'Jogo Netlify Engine '||s.game_key,final_res,now(),now())
  returning id into tx;

  insert into public.unified_game_rounds(member_id,game_key,session_id,bet_units,prize_units,multiplier,win,choice,result,tx_id,created_at)
  values(m.id,s.game_key,s.id,s.bet_units,prize,mult,win,s.choice,final_res,tx,now())
  returning id into round_id;

  update public.unified_game_sessions set status='finished', prize_units=prize, cashout_multiplier=case when s.game_key='crash' then mult else cashout_multiplier end, tx_id=tx, finished_at=now() where id=s.id;

  return jsonb_build_object('ok',true,'roundId',round_id,'txCode',(select tx_code from public.iris_transactions where id=tx),'astralCode',(select astral_code from public.iris_transactions where id=tx),'result',final_res);
end;
$$;

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
end;
$$;

drop function if exists public.app_real_animation_cashout_crash(text,uuid,numeric);
create or replace function public.app_real_animation_cashout_crash(p_token text, p_session_id uuid, p_cashout_multiplier numeric)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare m public.app_members; s public.unified_game_sessions; mult numeric; crash numeric;
begin
  m:=public.v25_current(p_token);
  select * into s from public.unified_game_sessions where id=p_session_id for update;
  if s.id is null then raise exception 'Sessão não encontrada.'; end if;
  if s.member_id<>m.id then raise exception 'Sessão não pertence ao usuário.'; end if;
  if s.game_key<>'crash' then raise exception 'Cashout só existe no Crash.'; end if;
  if s.status<>'started' then raise exception 'Sessão já finalizada.'; end if;
  crash:=coalesce(s.crash_point,1);
  mult:=least(greatest(coalesce(p_cashout_multiplier,1),1),crash);
  if coalesce(p_cashout_multiplier,1)>=crash then
    return public.app_real_animation_finish_internal(p_session_id,m.id,0,false,jsonb_build_object('cashout',false,'crashAt',crash));
  end if;
  return public.app_real_animation_finish_internal(p_session_id,m.id,mult,true,jsonb_build_object('cashout',true,'cashoutMultiplier',mult,'crashAt',crash));
end;
$$;

-- Harmony snapshot
create table if not exists public.harmony_announcements (
  id uuid primary key default extensions.gen_random_uuid(),
  title text,
  message text not null,
  icon text default '📢',
  active boolean not null default true,
  priority int not null default 100,
  created_at timestamptz default now()
);

insert into public.harmony_announcements(title,message,icon,active,priority)
values
('Servidor','Blinders Cassino online — Netlify Engine Build ativo.','🏆',true,10),
('Jogos','PixiJS, GSAP e Banco IRIS trabalhando juntos.','🎮',true,20),
('Suporte','WhatsApp Admin: 5511951289502.','📱',true,30)
on conflict do nothing;

drop function if exists public.app_harmony_system_snapshot(text);
create or replace function public.app_harmony_system_snapshot(p_token text)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare m public.app_members; tx_today int; bank_balance numeric; bank_label text; ann jsonb;
begin
  m:=public.v25_current(p_token);
  select count(*) into tx_today from public.iris_transactions where created_at::date=current_date;
  select coalesce(balance_units,0), public.v25_format(coalesce(balance_units,0)) into bank_balance, bank_label from public.iris_bank_accounts_mod020 where bank_key='EMSHBY';
  select coalesce(jsonb_agg(jsonb_build_object('title',title,'message',icon||' '||message) order by priority),'[]'::jsonb) into ann from public.harmony_announcements where active=true;

  return jsonb_build_object(
    'ok',true,
    'member',jsonb_build_object('nick',m.nick,'role',m.role),
    'summary',jsonb_build_object('transactionsToday',tx_today,'errorsToday',0),
    'bank',jsonb_build_object('balanceUnits',bank_balance,'balanceLabel',bank_label),
    'announcements',ann,
    'serverTime',now()
  );
end;
$$;

grant execute on all functions in schema public to anon, authenticated;

notify pgrst, 'reload schema';

select 'BLINDERS_NETLIFY_ENGINE_BUILD_OK' as status;
