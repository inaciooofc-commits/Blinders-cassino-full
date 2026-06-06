const { rpc, json, assertAdmin, options } = require('./_supabase.cjs');

exports.handler = async function handler(event) {
  const opt = options(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return json(405, { ok: false, message: 'Use POST.' });

  try {
    const body = JSON.parse(event.body || '{}');
    const token = String(body.token || '');

    await assertAdmin(token);

    const data = await rpc('app_admin_confirm_deposit', {
      p_token: token,
      p_code: body.code || body.target || '',
      p_amount: body.amount || '0',
      p_note: body.note || ''
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
