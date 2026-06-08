import { supabase, SupabaseConfig } from './supabaseClient.js';
const TOKEN_KEY='blinders_launch_token';
function token(){return localStorage.getItem(TOKEN_KEY)||'';}
function setToken(v){if(v)localStorage.setItem(TOKEN_KEY,v);}
function clearToken(){localStorage.removeItem(TOKEN_KEY);}
async function rpc(name,args={}){if(!supabase)return{ok:false,error:'Banco IRIS indisponível. Configure Supabase.',offline:true};const{data,error}=await supabase.rpc(name,args);if(error)return{ok:false,error:error.message||'Falha SQL.',details:error};return data&&typeof data==='object'?data:{ok:true,data};}
export const IrisSQL={
  status(){return{enabled:SupabaseConfig.enabled,url:SupabaseConfig.url,hasToken:Boolean(token())};},
  hasSession(){return Boolean(token());},
  logout(){clearToken();},
  async boot(){const t=token();if(!t)return{ok:false,needsLogin:true,error:'Login necessário.'};const w=await this.wallet();if(!w.ok)clearToken();return w;},
  async login(login,password){const r=await rpc('app_login',{p_login:login,p_password:password});if(r.ok&&r.token)setToken(r.token);return r;},
  async register(nick,irisId,phone,password){const r=await rpc('app_register',{p_nick:nick,p_iris_id:irisId,p_phone:phone,p_password:password});if(r.ok&&r.token)setToken(r.token);return r;},
  async repairPassword(login,phone,newPassword){return rpc('app_password_repair',{p_login:login,p_phone:phone,p_new_password:newPassword});},
  wallet(){return rpc('app_wallet',{p_token:token()});},
  deposit(amount,ref){return rpc('app_deposit',{p_token:token(),p_amount:amount,p_reference:ref});},
  withdraw(amount,dest){return rpc('app_withdraw',{p_token:token(),p_amount:amount,p_destination:dest});},
  transfer(to,amount){return rpc('app_transfer',{p_token:token(),p_to:to,p_amount:amount});},
  playGame(game,bet,choice,payload={}){return rpc('app_play_game',{p_token:token(),p_game:game,p_bet:bet,p_choice:choice,p_payload:payload});},
  buyItem(key){return rpc('app_buy_item',{p_token:token(),p_item_key:key});},
  setItemPrice(key,price){return rpc('app_admin_set_item_price',{p_token:token(),p_item_key:key,p_price:price});},
  savePhone(phone){return rpc('app_save_phone',{p_token:token(),p_phone:phone});},
  setGameMaintenance(game,locked){return rpc('app_admin_set_game_maintenance',{p_token:token(),p_game:game,p_locked:locked});},
  setRadio(youtubeUrl,title){return rpc('app_admin_set_radio',{p_token:token(),p_youtube_url:youtubeUrl,p_title:title});},
  getRadio(){return rpc('app_radio_now',{p_token:token()});},
  createFamily(name,kind){return rpc('app_create_family',{p_token:token(),p_name:name,p_kind:kind});},
  startTravel(toKey,itemKey=''){return rpc('app_start_travel',{p_token:token(),p_to_key:toKey,p_item_key:itemKey});},
  attackTerritory(territoryKey){return rpc('app_attack_territory',{p_token:token(),p_territory_key:territoryKey});},
  marry(target){return rpc('app_marriage_request',{p_token:token(),p_target:target});},
  adminBonus(amount){return rpc('app_admin_bonus',{p_token:token(),p_amount:amount});}
};
