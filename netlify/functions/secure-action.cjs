const { rpc, json, assertAdmin, options } = require('./_supabase.cjs');

exports.handler = async function handler(event) {
  const opt = options(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return json(405, { ok: false, message: 'Use POST.' });

  try {
    const body = JSON.parse(event.body || '{}');
    const token = String(body.token || '');
    const action = String(body.action || '');
    const payload = body.payload || {};

    await assertAdmin(token);

    const data = await rpc('app_admin_secure_action', {
      p_token: token,
      p_action: action,
      p_payload: payload
    }, 'anon');

    return json(200, data);
  } catch (error) {
    return json(error.status || 400, {
      ok: false,
      message: error.message,
      detail: error.data || null
    });
  }
};
