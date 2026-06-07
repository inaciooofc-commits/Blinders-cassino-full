create extension if not exists pgcrypto;

create table if not exists public.blinders_members (
  id uuid primary key default gen_random_uuid(),
  nick text not null,
  iris_id text not null,
  friend_code text not null,
  phone text default '',
  role text not null default 'member',
  balance numeric(40,2) not null default 0,
  locked numeric(40,2) not null default 0,
  vip_points integer not null default 0,
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
  status text not null default 'completed',
  description text default '',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.blinders_inventory (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.blinders_members(id) on delete cascade,
  item text not null,
  price numeric(40,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.blinders_game_rounds (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.blinders_members(id) on delete cascade,
  game_key text not null,
  bet numeric(40,2) not null,
  payout numeric(40,2) not null default 0,
  win boolean not null default false,
  result jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.blinders_members enable row level security;
alter table public.blinders_sessions enable row level security;
alter table public.blinders_transactions enable row level security;
alter table public.blinders_inventory enable row level security;
alter table public.blinders_game_rounds enable row level security;

revoke all on public.blinders_members from anon, authenticated;
revoke all on public.blinders_sessions from anon, authenticated;
revoke all on public.blinders_transactions from anon, authenticated;
revoke all on public.blinders_inventory from anon, authenticated;
revoke all on public.blinders_game_rounds from anon, authenticated;

create or replace function public.app_v146_seed_members()
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
end;
$$;

create or replace function public.app_v146_current(p_token text)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_member uuid;
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

create or replace function public.app_v146_tx(p_member_id uuid, p_type text, p_amount numeric, p_description text, p_status text default 'completed', p_metadata jsonb default '{}'::jsonb)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_id uuid;
begin
  insert into public.blinders_transactions(member_id,type,amount,status,description,metadata)
  values(p_member_id,coalesce(p_type,'tx'),coalesce(p_amount,0),coalesce(p_status,'completed'),coalesce(p_description,''),coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.app_v146_guest_session(p_nick text default 'KageShinobi')
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
  perform public.app_v146_seed_members();

  select * into v_member
  from public.blinders_members
  where lower(nick)=lower(v_clean_nick)
  limit 1;

  if v_member.id is null then
    insert into public.blinders_members(nick, iris_id, friend_code, role, balance, vip_points)
    values (
      v_clean_nick,
      'IRIS-' || upper(substr(encode(gen_random_bytes(5),'hex'),1,10)),
      'FR-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,8)),
      'member',
      10000,
      0
    )
    returning * into v_member;
  end if;

  v_token := encode(gen_random_bytes(32),'hex');

  insert into public.blinders_sessions(token, member_id)
  values(v_token, v_member.id);

  return jsonb_build_object('ok', true, 'token', v_token, 'message', 'Sessão SQL criada.', 'member', jsonb_build_object('nick', v_member.nick, 'iris', v_member.iris_id, 'friendCode', v_member.friend_code, 'phone', coalesce(v_member.phone,''), 'role', v_member.role));
end;
$$;

create or replace function public.app_v146_wallet(p_token text)
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
begin
  v_member_id := public.app_v146_current(p_token);
  select * into v_member from public.blinders_members where id = v_member_id;

  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'type', type, 'amount', amount, 'status', status, 'description', description, 'time', to_char(created_at, 'DD/MM/YYYY HH24:MI:SS')) order by created_at desc), '[]'::jsonb)
  into v_transactions
  from (select * from public.blinders_transactions where member_id = v_member_id order by created_at desc limit 30) q;

  select coalesce(jsonb_agg(item order by created_at desc), '[]'::jsonb)
  into v_inventory
  from public.blinders_inventory
  where member_id = v_member_id;

  if jsonb_array_length(v_inventory) = 0 then
    v_inventory := '["VIP Diamante","Badge Blinders","Moldura Neon"]'::jsonb;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('nick', nick, 'score', round(balance + vip_points * 10)) order by (balance + vip_points * 10) desc), '[]'::jsonb)
  into v_ranking
  from (select nick, balance, vip_points from public.blinders_members order by (balance + vip_points * 10) desc limit 10) r;

  return jsonb_build_object('ok', true, 'message', 'Carteira sincronizada com SQL.', 'member', jsonb_build_object('nick', v_member.nick, 'iris', v_member.iris_id, 'friendCode', v_member.friend_code, 'phone', coalesce(v_member.phone,''), 'role', v_member.role), 'balance', v_member.balance, 'locked', v_member.locked, 'vipPoints', v_member.vip_points, 'jackpot', 125347.89, 'transactions', v_transactions, 'inventory', v_inventory, 'ranking', v_ranking);
end;
$$;

create or replace function public.app_v146_deposit(p_token text, p_amount numeric, p_reference text default '')
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_member uuid;
  v_amount numeric := coalesce(p_amount,0);
begin
  if v_amount <= 0 then raise exception 'Valor de depósito inválido.'; end if;
  v_member := public.app_v146_current(p_token);
  update public.blinders_members set balance = balance + v_amount, vip_points = vip_points + greatest(1, round(v_amount / 50)::int) where id = v_member;
  perform public.app_v146_tx(v_member,'deposit',v_amount,'Depósito EMSHBY: ' || coalesce(p_reference,''),'approved',jsonb_build_object('bank','EMSHBY'));
  return jsonb_build_object('ok',true,'message','Depósito registrado no SQL.');
end;
$$;

create or replace function public.app_v146_withdraw(p_token text, p_amount numeric, p_destination text default '')
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_member uuid;
  v_balance numeric;
  v_amount numeric := coalesce(p_amount,0);
begin
  if v_amount <= 0 then raise exception 'Valor de saque inválido.'; end if;
  v_member := public.app_v146_current(p_token);
  select balance into v_balance from public.blinders_members where id = v_member;
  if v_amount > v_balance then raise exception 'Saldo insuficiente para saque.'; end if;
  update public.blinders_members set balance = balance - v_amount, locked = locked + v_amount where id = v_member;
  perform public.app_v146_tx(v_member,'withdraw',v_amount,'Saque solicitado: ' || coalesce(p_destination,''),'pending',jsonb_build_object('destination',p_destination));
  return jsonb_build_object('ok',true,'message','Saque solicitado no SQL.');
end;
$$;

create or replace function public.app_v146_transfer(p_token text, p_to text, p_amount numeric)
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
  v_sender := public.app_v146_current(p_token);
  select balance into v_balance from public.blinders_members where id = v_sender;
  if v_amount > v_balance then raise exception 'Saldo insuficiente.'; end if;

  select * into v_receiver from public.blinders_members
  where lower(nick)=lower(v_to) or lower(iris_id)=lower(v_to) or lower(friend_code)=lower(v_to)
  limit 1;

  if v_receiver.id is null then
    insert into public.blinders_members(nick, iris_id, friend_code, role, balance, vip_points)
    values (v_to, 'IRIS-' || upper(substr(encode(gen_random_bytes(5),'hex'),1,10)), 'FR-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,8)), 'member', 0, 0)
    returning * into v_receiver;
  end if;

  if v_receiver.id = v_sender then raise exception 'Não é possível transferir para si mesmo.'; end if;

  update public.blinders_members set balance = balance - v_amount where id = v_sender;
  update public.blinders_members set balance = balance + v_amount where id = v_receiver.id;

  perform public.app_v146_tx(v_sender,'transfer',-v_amount,'Transferência enviada para ' || v_receiver.nick,'completed',jsonb_build_object('to',v_receiver.nick));
  perform public.app_v146_tx(v_receiver.id,'transfer_in',v_amount,'Transferência recebida','completed',jsonb_build_object('from',v_sender));

  return jsonb_build_object('ok',true,'message','Transferência registrada no SQL.');
end;
$$;

create or replace function public.app_v146_buy_item(p_token text, p_item text, p_price numeric)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_member uuid;
  v_balance numeric;
  v_price numeric := coalesce(p_price,0);
begin
  if v_price <= 0 then raise exception 'Preço inválido.'; end if;
  v_member := public.app_v146_current(p_token);
  select balance into v_balance from public.blinders_members where id = v_member;
  if v_price > v_balance then raise exception 'Saldo insuficiente para compra.'; end if;
  update public.blinders_members set balance = balance - v_price where id = v_member;
  insert into public.blinders_inventory(member_id,item,price) values(v_member,coalesce(p_item,'Item'),v_price);
  perform public.app_v146_tx(v_member,'shop',-v_price,'Compra: ' || coalesce(p_item,'Item'),'completed');
  return jsonb_build_object('ok',true,'message','Compra registrada no SQL.');
end;
$$;

create or replace function public.app_v146_mission(p_token text, p_reward numeric, p_title text default 'Missão')
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_member uuid;
  v_reward numeric := coalesce(p_reward,0);
begin
  if v_reward <= 0 then raise exception 'Recompensa inválida.'; end if;
  v_member := public.app_v146_current(p_token);
  update public.blinders_members set balance = balance + v_reward, vip_points = vip_points + greatest(1, round(v_reward/10)::int) where id = v_member;
  perform public.app_v146_tx(v_member,'mission',v_reward,'Missão coletada: ' || coalesce(p_title,'Missão'),'completed');
  return jsonb_build_object('ok',true,'message','Missão registrada no SQL.');
end;
$$;

create or replace function public.app_v146_admin_bonus(p_token text, p_amount numeric default 777)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_member uuid;
  v_amount numeric := coalesce(p_amount,777);
begin
  v_member := public.app_v146_current(p_token);
  update public.blinders_members set balance = balance + v_amount where id = v_member;
  perform public.app_v146_tx(v_member,'admin_bonus',v_amount,'Bônus admin aplicado','completed');
  return jsonb_build_object('ok',true,'message','Bônus admin registrado no SQL.');
end;
$$;

create or replace function public.app_v146_play_game(p_token text, p_game text, p_bet numeric, p_choice text default '')
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
  v_win boolean := false;
  v_mult numeric := 0;
  v_payout numeric := 0;
  v_message text := '';
  v_result jsonb := '{}'::jsonb;
  v_num int;
begin
  if v_bet <= 0 then raise exception 'Aposta inválida.'; end if;
  v_member := public.app_v146_current(p_token);
  select balance into v_balance from public.blinders_members where id = v_member;
  if v_bet > v_balance then raise exception 'Saldo insuficiente.'; end if;

  if v_game = 'roulette' then
    v_num := floor(random()*37)::int;
    v_win := random() > 0.52;
    v_mult := case when v_win then 2 else 0 end;
    v_message := 'Roleta caiu em ' || v_num;
    v_result := jsonb_build_object('number',v_num,'visual',jsonb_build_object('number',v_num));
  elsif v_game = 'dice' then
    v_win := random() > 0.52;
    v_mult := case when v_win then 1.95 else 0 end;
    v_message := 'Dados finalizados.';
    v_result := jsonb_build_object('dice',jsonb_build_array(1+floor(random()*6)::int,1+floor(random()*6)::int));
  elsif v_game = 'blackjack' then
    v_win := random() > 0.50;
    v_mult := case when v_win then 2 else 0 end;
    v_message := case when v_win then 'Blackjack venceu.' else 'Banca venceu.' end;
  elsif v_game = 'bingo' then
    v_win := random() > 0.60;
    v_mult := case when v_win then 3 else 0 end;
    v_message := case when v_win then 'Bingo premiado.' else 'Sem bingo.' end;
  elsif v_game = 'slots' then
    v_win := random() > 0.70;
    v_mult := case when v_win then 5 else 0 end;
    v_message := case when v_win then 'Linha vencedora.' else 'Sem linha.' end;
  elsif v_game = 'memory' then
    v_win := random() > 0.55;
    v_mult := case when v_win then 2 else 0 end;
    v_message := case when v_win then 'Pares encontrados.' else 'Erros acima do limite.' end;
  elsif v_game = 'crash' then
    v_win := random() > 0.40;
    v_mult := case when v_win then round((1.2+random()*3)::numeric,2) else 0 end;
    v_message := case when v_win then 'Retirada a tempo.' else 'Crash antes da retirada.' end;
  else
    v_win := random() > 0.62;
    v_mult := case when v_win then 2 else 0 end;
    v_message := case when v_win then 'Jogo venceu.' else 'Sem prêmio.' end;
  end if;

  v_payout := case when v_win then v_bet * v_mult else 0 end;

  update public.blinders_members
  set balance = balance - v_bet + v_payout,
      vip_points = vip_points + greatest(1, round(v_bet / 25)::int)
  where id = v_member;

  insert into public.blinders_game_rounds(member_id, game_key, bet, payout, win, result)
  values(v_member, v_game, v_bet, v_payout, v_win, v_result);

  perform public.app_v146_tx(v_member, case when v_win then 'game_win' else 'game_loss' end, v_payout - v_bet, v_game || ': ' || v_message, 'completed', v_result || jsonb_build_object('bet',v_bet,'payout',v_payout));

  return jsonb_build_object('ok', true, 'message', 'Rodada registrada no SQL.', 'result', v_result || jsonb_build_object('game', v_game, 'win', v_win, 'bet', v_bet, 'payout', v_payout, 'multiplier', v_mult, 'message', v_message));
end;
$$;

grant execute on function public.app_v146_guest_session(text) to anon, authenticated;
grant execute on function public.app_v146_wallet(text) to anon, authenticated;
grant execute on function public.app_v146_deposit(text,numeric,text) to anon, authenticated;
grant execute on function public.app_v146_withdraw(text,numeric,text) to anon, authenticated;
grant execute on function public.app_v146_transfer(text,text,numeric) to anon, authenticated;
grant execute on function public.app_v146_play_game(text,text,numeric,text) to anon, authenticated;
grant execute on function public.app_v146_buy_item(text,text,numeric) to anon, authenticated;
grant execute on function public.app_v146_mission(text,numeric,text) to anon, authenticated;
grant execute on function public.app_v146_admin_bonus(text,numeric) to anon, authenticated;

select public.app_v146_seed_members();
notify pgrst, 'reload schema';
select 'BLINDERS_V14_6_SQL_CONNECT_OK' as status;
