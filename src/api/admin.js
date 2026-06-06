import { rpc, functionPost } from './rpc.js';
import { State } from '../core/State.js';

export async function harmonySnapshot() {
  return rpc('app_harmony_system_snapshot', { p_token: State.token });
}

export async function adminSecureRpc(rpcName, params = {}) {
  return functionPost('admin-rpc', {
    token: State.token,
    rpc: rpcName,
    params
  });
}
