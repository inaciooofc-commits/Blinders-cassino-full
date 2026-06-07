import { supabase, SupabaseConfig } from './supabaseClient.js';

const TOKEN_KEY = 'blinders_final_sql_token';
let lastError = '';

async function rpc(name, args = {}) {
  if (!supabase) {
    lastError = 'Supabase não configurado. Usando modo local.';
    return { ok: false, offline: true, error: lastError };
  }

  const { data, error } = await supabase.rpc(name, args);

  if (error) {
    lastError = error.message || 'Erro Supabase.';
    console.warn('[IRIS SQL]', name, error);
    return { ok: false, error: lastError, details: error };
  }

  if (data && typeof data === 'object' && data.ok === false) {
    lastError = data.error || data.message || 'RPC retornou erro.';
    return { ok: false, error: lastError, data };
  }

  lastError = '';
  return data && typeof data === 'object' ? data : { ok: true, data };
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export const IrisSQL = {
  enabled() {
    return SupabaseConfig.enabled;
  },

  status() {
    return {
      enabled: SupabaseConfig.enabled,
      url: SupabaseConfig.url,
      hasKey: Boolean(SupabaseConfig.anonKey),
      token: getToken(),
      lastError
    };
  },

  async boot(nick = 'KageShinobi') {
    if (!SupabaseConfig.enabled) {
      return { ok: false, offline: true, message: 'Supabase não configurado no ambiente.' };
    }

    let token = getToken();

    if (!token) {
      const session = await rpc('app_guest_session', { p_nick: nick });
      if (!session.ok) return session;
      token = session.token;
      setToken(token);
    }

    const wallet = await this.wallet();

    if (!wallet.ok) {
      localStorage.removeItem(TOKEN_KEY);
      const retry = await rpc('app_guest_session', { p_nick: nick });
      if (!retry.ok) return retry;
      setToken(retry.token);
      return this.wallet();
    }

    return wallet;
  },

  wallet() {
    return rpc('app_wallet', { p_token: getToken() });
  },

  async deposit(amount, reference = '') {
    const result = await rpc('app_deposit', { p_token: getToken(), p_amount: Number(amount || 0), p_reference: reference });
    return result.ok ? this.walletWithMessage(result.message || 'Depósito registrado.') : result;
  },

  async withdraw(amount, destination = '') {
    const result = await rpc('app_withdraw', { p_token: getToken(), p_amount: Number(amount || 0), p_destination: destination });
    return result.ok ? this.walletWithMessage(result.message || 'Saque solicitado.') : result;
  },

  async transfer(to, amount) {
    const result = await rpc('app_transfer', { p_token: getToken(), p_to: to, p_amount: Number(amount || 0) });
    return result.ok ? this.walletWithMessage(result.message || 'Transferência enviada.') : result;
  },

  async playGame(game, bet, choice = '', payload = {}) {
    const result = await rpc('app_play_game', {
      p_token: getToken(),
      p_game: game,
      p_bet: Number(bet || 0),
      p_choice: String(choice || ''),
      p_payload: payload
    });
    if (!result.ok) return result;
    const wallet = await this.wallet();
    return { ...wallet, gameResult: result.result, message: result.message };
  },

  async buyItem(itemKey) {
    const result = await rpc('app_buy_item', { p_token: getToken(), p_item_key: itemKey });
    return result.ok ? this.walletWithMessage(result.message || 'Item comprado.') : result;
  },

  async collectMission(missionKey) {
    const result = await rpc('app_collect_mission', { p_token: getToken(), p_mission_key: missionKey });
    return result.ok ? this.walletWithMessage(result.message || 'Missão coletada.') : result;
  },

  async enterEvent(eventKey) {
    const result = await rpc('app_enter_event', { p_token: getToken(), p_event_key: eventKey });
    return result.ok ? this.walletWithMessage(result.message || 'Evento registrado.') : result;
  },

  async adminBonus(amount = 777) {
    const result = await rpc('app_admin_bonus', { p_token: getToken(), p_amount: Number(amount || 777) });
    return result.ok ? this.walletWithMessage(result.message || 'Bônus aplicado.') : result;
  },

  async savePhone(phone) {
    const result = await rpc('app_save_phone', { p_token: getToken(), p_phone: phone });
    return result.ok ? this.walletWithMessage(result.message || 'Telefone salvo.') : result;
  },

  async walletWithMessage(message) {
    const wallet = await this.wallet();
    return { ...wallet, message };
  }
};
