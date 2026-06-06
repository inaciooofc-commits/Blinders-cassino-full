import { rpc } from './rpc.js';
import { setSession, clearSession } from '../core/State.js';

export async function login(identifier, password, area = 'member') {
  const data = await rpc('app_login_v25', {
    p_identifier: identifier,
    p_password: password,
    p_area: area,
    p_user_agent: navigator.userAgent
  });

  setSession(data.token, data.member);
  return data;
}

export async function registerMember({ nick, zarcoviAccount, password }) {
  return rpc('app_register_member_v25', {
    p_zarcovi_account: zarcoviAccount,
    p_nick: nick,
    p_password: password,
    p_user_agent: navigator.userAgent
  });
}

export function logout() {
  clearSession();
  location.href = '/login';
}
