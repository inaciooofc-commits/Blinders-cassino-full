-- ============================================================
-- BLINDERS FINAL SQL
-- Cole inteiro no Supabase SQL Editor.
-- Resultado esperado:
-- BLINDERS_FINAL_SQL_OK
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.blinders_members (
  id uuid primary key default gen_random_uuid(),
  nick text not null,
  iris_id text not null,
  friend_code text not null,
  phone text default '',
  role text not null default 'member',
  balance numeric(40,2) not null default 0 check (balance >= 0),
  locked numeric(40,2) not null default 0 check (locked >= 0),
  vip_points integer not null default 0 check (vip_points >= 0),
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create unique index if not exists ux_blinders_members_nick on public.blinders_members(lower(nick));
create unique index if not exists ux_blinders_members_iris on public.blinders_members(lower(iris_id));
create unique index if not exists ux_blinders_members_friend on public.blinders_members(lower(friend_code));

create table if not exists public.blinders_sessions (
  token text primary key,
  member_id uuid not null references public.blinders_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create table if not exists public.blinders_transactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.blinders_members(id) on delete cascade,
  type text not null,
  amount numeric(40,2) not null default 0,
  status text not null default 'completed' check (status in ('pending','approved','rejected','completed')),
  description text default '',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists ix_blinders_transactions_member_created on public.blinders_transactions(member_id, created_at desc);

create table if not exists public.blinders_inventory (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.blinders_members(id) on delete cascade,
  item_key text not null,
  item_name text not null,
  price numeric(40,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.blinders_game_rounds (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.blinders_members(id) on delete cascade,
  game_key text not null,
  bet numeric(40,2) not null check (bet > 0),
  payout numeric(40,2) not null default 0,
  win boolean not null default false,
  result jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.blinders_audit (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.blinders_members(id) on delete set null,
  action text not null,
  message text default '',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.blinders_shop_items (
  item_key text primary key,
  title text not null,
  description text not null default '',
  item_type text not null default 'cosmetic',
  rarity text not null default 'common',
  price numeric(40,2) not null default 0 check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.blinders_missions (
  mission_key text primary key,
  title text not null,
  description text not null default '',
  reward numeric(40,2) not null default 0 check (reward >= 0),
  active boolean not null default true,
  once_per_member boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.blinders_member_missions (
  member_id uuid not null references public.blinders_members(id) on delete cascade,
  mission_key text not null references public.blinders_missions(mission_key) on delete cascade,
  collected_at timestamptz not null default now(),
  primary key(member_id, mission_key)
);

create table if not exists public.blinders_events (
  event_key text primary key,
  title text not null,
  description text not null default '',
  fee numeric(40,2) not null default 0 check (fee >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.blinders_event_entries (
  member_id uuid not null references public.blinders_members(id) on delete cascade,
  event_key text not null references public.blinders_events(event_key) on delete cascade,
  entered_at timestamptz not null default now(),
  primary key(member_id, event_key)
);

alter table public.blinders_members enable row level security;
alter table public.blinders_sessions enable row level security;
alter table public.blinders_transactions enable row level security;
alter table public.blinders_inventory enable row level security;
alter table public.blinders_game_rounds enable row level security;
alter table public.blinders_audit enable row level security;
alter table public.blinders_shop_items enable row level security;
alter table public.blinders_missions enable row level security;
alter table public.blinders_member_missions enable row level security;
alter table public.blinders_events enable row level security;
alter table public.blinders_event_entries enable row level security;

revoke all on public.blinders_members from anon, authenticated;
revoke all on public.blinders_sessions from anon, authenticated;
revoke all on public.blinders_transactions from anon, authenticated;
revoke all on public.blinders_inventory from anon, authenticated;
revoke all on public.blinders_game_rounds from anon, authenticated;
revoke all on public.blinders_audit from anon, authenticated;
revoke all on public.blinders_member_missions from anon, authenticated;
revoke all on public.blinders_event_entries from anon, authenticated;

create or replace function public.app_tx(
  p_member_id uuid,
  p_type text,
  p_amount numeric,
  p_description text,
  p_status text default 'completed',
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare v_id uuid;
begin
  insert into public.blinders_transactions(member_id,type,amount,status,description,metadata)
  values(p_member_id,coalesce(p_type,'tx'),coalesce(p_amount,0),coalesce(p_status,'completed'),coalesce(p_description,''),coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.app_audit_log(
  p_member_id uuid,
  p_action text,
  p_message text default '',
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.blinders_audit(member_id,action,message,metadata)
  values(p_member_id,p_action,coalesce(p_message,''),coalesce(p_metadata,'{}'::jsonb));
end;
$$;

create or replace function public.app_seed()
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.blinders_members(nick, iris_id, friend_code, role, balance, vip_points)
  values
    ('KageShinobi','IRIS-KAGE-777','KS-777','admin',25430.75,12870),
    ('Shinigami_7','IRIS-SHINI-777','SG-777','member',50000,7000),
    ('AzulNeon','IRIS-AZUL-777','AZ-777','member',35000,6000),
    ('ShadowBR','IRIS-SHADOW-777','SH-777','member',28000,4000),
    ('IrisQueen','IRIS-QUEEN-777','IQ-777','member',22000,3800)
  on conflict(lower(nick)) do nothing;

  insert into public.blinders_shop_items(item_key,title,description,item_type,rarity,price,active)
  values
    ('frame_neon','Moldura Neon','Frame visual roxo/dourado','frame','rare',350,true),
    ('badge_iris','Badge IRIS','Insígnia Banco IRIS','badge','rare',500,true),
    ('title_vip','Título VIP','Título especial no perfil','title','epic',750,true),
    ('theme_blue','Tema Anime Azul','Tema cyber azul','theme','epic',900,true),
    ('ticket_event','Ticket Evento','Entrada especial','ticket','common',1500,true),
    ('diamond_card','Cartão Diamante','Item raro de perfil','item','legendary',2200,true)
  on conflict(item_key) do update set title=excluded.title, description=excluded.description, price=excluded.price, active=true;

  insert into public.blinders_missions(mission_key,title,description,reward,active,once_per_member)
  values
    ('daily_login','Login diário','Receba bônus diário.',150,true,true),
    ('play_three','Jogar 3 partidas','Recompensa de atividade.',300,true,true),
    ('use_bank','Usar Banco IRIS','Movimente sua carteira.',200,true,true),
    ('enter_event','Entrar em evento','Participe de evento.',500,true,true),
    ('win_bingo','Ganhar no Bingo','Missão especial.',700,true,true),
    ('win_blackjack','Ganhar no Blackjack','Missão de mesa.',700,true,true)
  on conflict(mission_key) do update set title=excluded.title, description=excluded.description, reward=excluded.reward, active=true;

  insert into public.blinders_events(event_key,title,description,fee,active)
  values
    ('blackjack_tournament','Torneio Blackjack','Hoje às 20:00',300,true),
    ('bingo_night','Noite do Bingo','Sorteios em sequência',150,true),
    ('vip_weekend','Fim de Semana VIP','Bônus e ranking especial',500,true),
    ('iris_treasure','Caça ao Tesouro IRIS','Evento de exploração',250,true)
  on conflict(event_key) do update set title=excluded.title, description=excluded.description, fee=excluded.fee, active=true;
end;
$$;

create or replace function public.app_current(p_token text)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare v_member uuid;
begin
  select member_id into v_member
  from public.blinders_sessions
  where token = p_token and expires_at > now()
  limit 1;

  if v_member is null then
    raise exception 'Sessão inválida ou expirada.';
  end if;

  update public.blinders_members set last_seen = now() where id = v_member;
  return v_member;
end;
$$;

create or replace function public.app_guest_session(p_nick text default 'KageShinobi')
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_member public.blinders_members;
  v_token text;
  v_clean_nick text := coalesce(nullif(trim(p_nick),''),'KageShinobi');
begin
  perform public.app_seed();

  select * into v_member from public.blinders_members where lower(nick)=lower(v_clean_nick) limit 1;

  if v_member.id is null then
    insert into public.blinders_members(nick, iris_id, friend_code, role, balance, vip_points)
    values(v_clean_nick,'IRIS-' || upper(substr(encode(gen_random_bytes(5),'hex'),1,10)),'FR-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,8)),'member',10000,0)
    returning * into v_member;
  end if;

  v_token := encode(gen_random_bytes(32),'hex');
  insert into public.blinders_sessions(token, member_id) values(v_token, v_member.id);

  perform public.app_audit_log(v_member.id,'session','Sessão criada');

  return jsonb_build_object('ok', true, 'token', v_token, 'message', 'Sessão SQL criada.', 'member', jsonb_build_object('nick', v_member.nick, 'iris', v_member.iris_id, 'friendCode', v_member.friend_code, 'phone', coalesce(v_member.phone,''), 'role', v_member.role));
end;
$$;

create or replace function public.app_wallet(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_member_id uuid;
  v_member public.blinders_members;
  v_transactions jsonb;
  v_inventory jsonb;
  v_ranking jsonb;
  v_missions jsonb;
begin
  v_member_id := public.app_current(p_token);
  select * into v_member from public.blinders_members where id=v_member_id;

  select coalesce(jsonb_agg(jsonb_build_object('id',id,'type',type,'amount',amount,'status',status,'description',description,'time',to_char(created_at,'DD/MM/YYYY HH24:MI:SS')) order by created_at desc),'[]'::jsonb)
  into v_transactions
  from (select * from public.blinders_transactions where member_id=v_member_id order by created_at desc limit 40) q;

  select coalesce(jsonb_agg(item_name order by created_at desc),'[]'::jsonb)
  into v_inventory
  from public.blinders_inventory where member_id=v_member_id;

  if jsonb_array_length(v_inventory)=0 then
    v_inventory := '["VIP Diamante","Badge Blinders","Moldura Neon"]'::jsonb;
  end if;

  select coalesce(jsonb_object_agg(mission_key,true),'{}'::jsonb)
  into v_missions
  from public.blinders_member_missions
  where member_id=v_member_id;

  select coalesce(jsonb_agg(jsonb_build_object('nick',nick,'score',round(balance + vip_points * 10)) order by (balance + vip_points * 10) desc),'[]'::jsonb)
  into v_ranking
  from (select nick,balance,vip_points from public.blinders_members order by (balance+vip_points*10) desc limit 10) r;

  return jsonb_build_object(
    'ok',true,
    'message','Carteira sincronizada com SQL.',
    'member',jsonb_build_object('nick',v_member.nick,'iris',v_member.iris_id,'friendCode',v_member.friend_code,'phone',coalesce(v_member.phone,''),'role',v_member.role),
    'balance',v_member.balance,
    'locked',v_member.locked,
    'vipPoints',v_member.vip_points,
    'jackpot',125347.89,
    'transactions',v_transactions,
    'inventory',v_inventory,
    'ranking',v_ranking,
    'missions',coalesce(v_missions,'{}'::jsonb)
  );
end;
$$;

create or replace function public.app_deposit(p_token text, p_amount numeric, p_reference text default '')
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_member uuid; v_amount numeric := coalesce(p_amount,0);
begin
  if v_amount <= 0 then raise exception 'Valor de depósito inválido.'; end if;
  v_member := public.app_current(p_token);
  update public.blinders_members set balance=balance+v_amount, vip_points=vip_points+greatest(1,round(v_amount/50)::int) where id=v_member;
  perform public.app_tx(v_member,'deposit',v_amount,'Depósito EMSHBY: ' || coalesce(p_reference,''),'approved',jsonb_build_object('bank','EMSHBY'));
  perform public.app_audit_log(v_member,'deposit','Depósito registrado');
  return jsonb_build_object('ok',true,'message','Depósito registrado no SQL.');
end;
$$;

create or replace function public.app_withdraw(p_token text, p_amount numeric, p_destination text default '')
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_member uuid; v_balance numeric; v_amount numeric := coalesce(p_amount,0);
begin
  if v_amount <= 0 then raise exception 'Valor de saque inválido.'; end if;
  v_member := public.app_current(p_token);
  select balance into v_balance from public.blinders_members where id=v_member;
  if v_amount > v_balance then raise exception 'Saldo insuficiente para saque.'; end if;
  update public.blinders_members set balance=balance-v_amount, locked=locked+v_amount where id=v_member;
  perform public.app_tx(v_member,'withdraw',v_amount,'Saque solicitado: ' || coalesce(p_destination,''),'pending',jsonb_build_object('destination',p_destination));
  perform public.app_audit_log(v_member,'withdraw','Saque solicitado');
  return jsonb_build_object('ok',true,'message','Saque solicitado no SQL.');
end;
$$;

create or replace function public.app_transfer(p_token text, p_to text, p_amount numeric)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_sender uuid;
  v_receiver public.blinders_members;
  v_balance numeric;
  v_amount numeric := coalesce(p_amount,0);
  v_to text := trim(coalesce(p_to,''));
begin
  if v_amount <= 0 then raise exception 'Valor de transferência inválido.'; end if;
  if v_to = '' then raise exception 'Destino obrigatório.'; end if;

  v_sender := public.app_current(p_token);
  select balance into v_balance from public.blinders_members where id=v_sender;
  if v_amount > v_balance then raise exception 'Saldo insuficiente.'; end if;

  select * into v_receiver from public.blinders_members
  where lower(nick)=lower(v_to) or lower(iris_id)=lower(v_to) or lower(friend_code)=lower(v_to)
  limit 1;

  if v_receiver.id is null then
    insert into public.blinders_members(nick, iris_id, friend_code, role, balance, vip_points)
    values(v_to,'IRIS-' || upper(substr(encode(gen_random_bytes(5),'hex'),1,10)),'FR-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,8)),'member',0,0)
    returning * into v_receiver;
  end if;

  if v_receiver.id = v_sender then raise exception 'Não é possível transferir para si mesmo.'; end if;

  update public.blinders_members set balance=balance-v_amount where id=v_sender;
  update public.blinders_members set balance=balance+v_amount where id=v_receiver.id;

  perform public.app_tx(v_sender,'transfer',-v_amount,'Transferência enviada para ' || v_receiver.nick,'completed',jsonb_build_object('to',v_receiver.nick));
  perform public.app_tx(v_receiver.id,'transfer_in',v_amount,'Transferência recebida','completed',jsonb_build_object('from',v_sender));
  perform public.app_audit_log(v_sender,'transfer','Transferência enviada');

  return jsonb_build_object('ok',true,'message','Transferência registrada no SQL.');
end;
$$;

create or replace function public.app_play_game(p_token text, p_game text, p_bet numeric, p_choice text default '', p_payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_member uuid;
  v_balance numeric;
  v_game text := lower(coalesce(p_game,''));
  v_bet numeric := coalesce(p_bet,0);
  v_result jsonb := coalesce(p_payload,'{}'::jsonb);
  v_win boolean := coalesce((v_result->>'win')::boolean,false);
  v_payout numeric := coalesce((v_result->>'payout')::numeric,0);
  v_message text := coalesce(v_result->>'message','Rodada registrada.');
begin
  if v_bet <= 0 then raise exception 'Aposta inválida.'; end if;
  v_member := public.app_current(p_token);
  select balance into v_balance from public.blinders_members where id=v_member;
  if v_bet > v_balance then raise exception 'Saldo insuficiente.'; end if;

  if v_result = '{}'::jsonb then
    v_win := random() > 0.55;
    v_payout := case when v_win then v_bet * 2 else 0 end;
    v_message := case when v_win then 'Vitória registrada.' else 'Derrota registrada.' end;
    v_result := jsonb_build_object('win',v_win,'payout',v_payout,'message',v_message);
  end if;

  update public.blinders_members
  set balance=balance-v_bet+v_payout,
      vip_points=vip_points+greatest(1,round(v_bet/25)::int)
  where id=v_member;

  insert into public.blinders_game_rounds(member_id, game_key, bet, payout, win, result)
  values(v_member,v_game,v_bet,v_payout,v_win,v_result);

  perform public.app_tx(v_member,case when v_win then 'game_win' else 'game_loss' end,v_payout-v_bet,v_game || ': ' || v_message,'completed',v_result || jsonb_build_object('bet',v_bet,'payout',v_payout));
  perform public.app_audit_log(v_member,'game',v_game || ': ' || v_message);

  return jsonb_build_object('ok',true,'message','Rodada registrada no SQL.','result',v_result || jsonb_build_object('game',v_game,'bet',v_bet,'payout',v_payout,'win',v_win));
end;
$$;

create or replace function public.app_buy_item(p_token text, p_item_key text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_member uuid;
  v_item public.blinders_shop_items;
  v_balance numeric;
begin
  v_member := public.app_current(p_token);
  select * into v_item from public.blinders_shop_items where item_key=p_item_key and active=true;
  if v_item.item_key is null then raise exception 'Item não encontrado.'; end if;

  select balance into v_balance from public.blinders_members where id=v_member;
  if v_item.price > v_balance then raise exception 'Saldo insuficiente para compra.'; end if;

  update public.blinders_members set balance=balance-v_item.price where id=v_member;
  insert into public.blinders_inventory(member_id,item_key,item_name,price) values(v_member,v_item.item_key,v_item.title,v_item.price);
  perform public.app_tx(v_member,'shop',-v_item.price,'Compra: ' || v_item.title,'completed');
  perform public.app_audit_log(v_member,'shop','Item comprado: ' || v_item.title);

  return jsonb_build_object('ok',true,'message','Compra registrada no SQL.');
end;
$$;

create or replace function public.app_collect_mission(p_token text, p_mission_key text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_member uuid;
  v_mission public.blinders_missions;
begin
  v_member := public.app_current(p_token);
  select * into v_mission from public.blinders_missions where mission_key=p_mission_key and active=true;
  if v_mission.mission_key is null then raise exception 'Missão não encontrada.'; end if;

  insert into public.blinders_member_missions(member_id,mission_key) values(v_member,v_mission.mission_key);
  update public.blinders_members set balance=balance+v_mission.reward, vip_points=vip_points+greatest(1,round(v_mission.reward/10)::int) where id=v_member;
  perform public.app_tx(v_member,'mission',v_mission.reward,'Missão coletada: ' || v_mission.title,'completed');
  perform public.app_audit_log(v_member,'mission','Missão coletada: ' || v_mission.title);

  return jsonb_build_object('ok',true,'message','Missão registrada no SQL.');
exception when unique_violation then
  return jsonb_build_object('ok',false,'error','Missão já coletada.');
end;
$$;

create or replace function public.app_enter_event(p_token text, p_event_key text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_member uuid;
  v_event public.blinders_events;
  v_balance numeric;
begin
  v_member := public.app_current(p_token);
  select * into v_event from public.blinders_events where event_key=p_event_key and active=true;
  if v_event.event_key is null then raise exception 'Evento não encontrado.'; end if;

  select balance into v_balance from public.blinders_members where id=v_member;
  if v_event.fee > v_balance then raise exception 'Saldo insuficiente para evento.'; end if;

  insert into public.blinders_event_entries(member_id,event_key) values(v_member,v_event.event_key) on conflict do nothing;
  update public.blinders_members set balance=balance-v_event.fee where id=v_member;
  perform public.app_tx(v_member,'event',-v_event.fee,'Entrada em evento: ' || v_event.title,'completed');
  perform public.app_audit_log(v_member,'event','Entrada em evento: ' || v_event.title);

  return jsonb_build_object('ok',true,'message','Evento registrado no SQL.');
end;
$$;

create or replace function public.app_admin_bonus(p_token text, p_amount numeric default 777)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_member uuid; v_role text; v_amount numeric := coalesce(p_amount,777);
begin
  v_member := public.app_current(p_token);
  select role into v_role from public.blinders_members where id=v_member;
  if v_role not in ('admin','owner') then raise exception 'Acesso admin negado.'; end if;

  update public.blinders_members set balance=balance+v_amount where id=v_member;
  perform public.app_tx(v_member,'admin_bonus',v_amount,'Bônus admin aplicado','completed');
  perform public.app_audit_log(v_member,'admin','Bônus admin aplicado');

  return jsonb_build_object('ok',true,'message','Bônus admin registrado no SQL.');
end;
$$;

create or replace function public.app_save_phone(p_token text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_member uuid; v_phone text := coalesce(trim(p_phone),'');
begin
  if v_phone <> '' and v_phone !~ '^[0-9]{2} [0-9]{4,5}-[0-9]{4}$' then
    raise exception 'Telefone inválido. Use xx xxxxx-xxxx.';
  end if;

  v_member := public.app_current(p_token);
  update public.blinders_members set phone=v_phone where id=v_member;
  perform public.app_tx(v_member,'profile',0,'Telefone atualizado','completed');
  perform public.app_audit_log(v_member,'profile','Telefone atualizado');

  return jsonb_build_object('ok',true,'message','Telefone salvo no SQL.');
end;
$$;

grant execute on function public.app_guest_session(text) to anon, authenticated;
grant execute on function public.app_wallet(text) to anon, authenticated;
grant execute on function public.app_deposit(text,numeric,text) to anon, authenticated;
grant execute on function public.app_withdraw(text,numeric,text) to anon, authenticated;
grant execute on function public.app_transfer(text,text,numeric) to anon, authenticated;
grant execute on function public.app_play_game(text,text,numeric,text,jsonb) to anon, authenticated;
grant execute on function public.app_buy_item(text,text) to anon, authenticated;
grant execute on function public.app_collect_mission(text,text) to anon, authenticated;
grant execute on function public.app_enter_event(text,text) to anon, authenticated;
grant execute on function public.app_admin_bonus(text,numeric) to anon, authenticated;
grant execute on function public.app_save_phone(text,text) to anon, authenticated;

select public.app_seed();
notify pgrst, 'reload schema';
select 'BLINDERS_FINAL_SQL_OK' as status;
