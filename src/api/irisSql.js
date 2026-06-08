import { supabase, SupabaseConfig } from './supabaseClient.js';
const TOKEN_KEY = 'blinders_launch_token';
const token = () => localStorage.getItem(TOKEN_KEY) || '';
const setToken = v => { if (v) localStorage.setItem(TOKEN_KEY, v); };
async function rpc(name, args = {}) {
  if (!supabase) return { ok:false, error:'Banco IRIS indisponível. Configure Supabase.', offline:true };
  const { data, error } = await supabase.rpc(name, args);
  if (error) return { ok:false, error:error.message || 'Falha SQL.', details:error };
  return data && typeof data === 'object' ? data : { ok:true, data };
}
export const IrisSQL = {
  status(){ return { enabled:SupabaseConfig.enabled, url:SupabaseConfig.url, hasToken:Boolean(token()) }; },
  async boot(nick='KageShinobi'){ let t=token(); if(!t){const s=await rpc('app_guest_session',{p_nick:nick}); if(!s.ok)return s; setToken(s.token); t=s.token;} const w=await this.wallet(); if(!w.ok){localStorage.removeItem(TOKEN_KEY); const s=await rpc('app_guest_session',{p_nick:nick}); if(!s.ok)return s; setToken(s.token); return this.wallet();} return w; },
  wallet(){ return rpc('app_wallet',{p_token:token()}); },
  deposit(a,r){ return rpc('app_deposit',{p_token:token(),p_amount:a,p_reference:r}); },
  withdraw(a,d){ return rpc('app_withdraw',{p_token:token(),p_amount:a,p_destination:d}); },
  transfer(to,a){ return rpc('app_transfer',{p_token:token(),p_to:to,p_amount:a}); },
  playGame(g,b,c,p={}){ return rpc('app_play_game',{p_token:token(),p_game:g,p_bet:b,p_choice:c,p_payload:p}); },
  buyItem(k){ return rpc('app_buy_item',{p_token:token(),p_item_key:k}); },
  setItemPrice(k,p){ return rpc('app_admin_set_item_price',{p_token:token(),p_item_key:k,p_price:p}); },
  setGameMaintenance(g,l){ return rpc('app_admin_set_game_maintenance',{p_token:token(),p_game:g,p_locked:l}); },
  setRadio(u,t){ return rpc('app_admin_set_radio',{p_token:token(),p_youtube_url:u,p_title:t}); },
  getRadio(){ return rpc('app_radio_now',{p_token:token()}); },
  createFamily(n,k){ return rpc('app_create_family',{p_token:token(),p_name:n,p_kind:k}); },
  startTravel(to,item=''){ return rpc('app_start_travel',{p_token:token(),p_to_key:to,p_item_key:item}); },
  attackTerritory(t){ return rpc('app_attack_territory',{p_token:token(),p_territory_key:t}); },
  marry(t){ return rpc('app_marriage_request',{p_token:token(),p_target:t}); },
  adminBonus(a){ return rpc('app_admin_bonus',{p_token:token(),p_amount:a}); }
};
