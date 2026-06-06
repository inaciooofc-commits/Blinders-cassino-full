const { rpc, json } = require('./_supabase.cjs');

const ALLOWED = new Set([
  'app_harmony_system_snapshot',
  'app_real_animation_game_history',
  'app_real_animation_rules',
  'app_v25_admin_dashboard',
  'app_v25_admin_notifications',
  'app_mod030_admin_shop_items'
]);

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, message: 'Use POST.' });

  try {
    const body = JSON.parse(event.body || '{}');
    const token = String(body.token || '');
    const rpcName = String(body.rpc || '');
    const params = body.params || {};

    if (!token) return json(401, { ok: false, message: 'Token ausente.' });
    if (!ALLOWED.has(rpcName)) return json(403, { ok: false, message: 'RPC não permitida.' });

    const member = await rpc('v25_current', { p_token: token }, true);
    if (!['admin', 'owner'].includes(member.role)) {
      return json(403, { ok: false, message: 'Acesso reservado para admin/dono.' });
    }

    const data = await rpc(rpcName, { ...params, p_token: token }, true);
    return json(200, data);
  } catch (error) {
    return json(error.status || 400, { ok: false, message: error.message, detail: error.data || null });
  }
};
