import { supabase, SupabaseConfig } from './supabaseClient.js';

const TOKEN_KEY = 'blinders_v146_sql_token';
let lastError = '';

async function rpc(name, args = {}) {
  if (!supabase) return { ok: false, error: 'Supabase não configurado.' };
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    lastError = error.message || 'Erro Supabase.';
    console.warn('[IRIS SQL]', name, error);
    return { ok: false, error: lastError, details: error };
  }
  lastError = '';
  return data && typeof data === 'object' ? data : { ok: true, data };
}

const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
const setToken = token => { if (token) localStorage.setItem(TOKEN_KEY, token); };

export const IrisSQL = {
  status() { return { enabled: SupabaseConfig.enabled, url: SupabaseConfig.url, hasKey: Boolean(SupabaseConfig.anonKey), token: getToken(), lastError }; },

  async boot(nick = 'KageShinobi') {
    let token = getToken();
    if (!token) {
      const session = await rpc('app_v146_guest_session', { p_nick: nick });
      if (!session.ok) return session;
      token = session.token;
      setToken(token);
    }
    const wallet = await this.wallet();
    if (!wallet.ok) {
      localStorage.removeItem(TOKEN_KEY);
      const retry = await rpc('app_v146_guest_session', { p_nick: nick });
      if (!retry.ok) return retry;
      setToken(retry.token);
      return this.wallet();
    }
    return wallet;
  },

  wallet() { return rpc('app_v146_wallet', { p_token: getToken() }); },
  async deposit(amount, reference='') { const r=await rpc('app_v146_deposit',{p_token:getToken(),p_amount:Number(amount||0),p_reference:reference}); return r.ok ? this.walletWithMessage(r.message) : r; },
  async withdraw(amount, destination='') { const r=await rpc('app_v146_withdraw',{p_token:getToken(),p_amount:Number(amount||0),p_destination:destination}); return r.ok ? this.walletWithMessage(r.message) : r; },
  async transfer(to, amount) { const r=await rpc('app_v146_transfer',{p_token:getToken(),p_to:to,p_amount:Number(amount||0)}); return r.ok ? this.walletWithMessage(r.message) : r; },
  async playGame(game, bet, choice='') { const r=await rpc('app_v146_play_game',{p_token:getToken(),p_game:game,p_bet:Number(bet||0),p_choice:String(choice||'')}); if(!r.ok)return r; const w=await this.wallet(); return {...w, gameResult:r.result, message:r.message}; },
  async buyItem(item, price) { const r=await rpc('app_v146_buy_item',{p_token:getToken(),p_item:item,p_price:Number(price||0)}); return r.ok ? this.walletWithMessage(r.message) : r; },
  async mission(reward, title='Missão') { const r=await rpc('app_v146_mission',{p_token:getToken(),p_reward:Number(reward||0),p_title:title}); return r.ok ? this.walletWithMessage(r.message) : r; },
  async adminBonus(amount=777) { const r=await rpc('app_v146_admin_bonus',{p_token:getToken(),p_amount:Number(amount||777)}); return r.ok ? this.walletWithMessage(r.message) : r; },
  async walletWithMessage(message) { const w=await this.wallet(); return {...w, message}; }
};
