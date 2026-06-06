const { rpc, json } = require('./_supabase.cjs');

exports.handler = async function handler(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const data = await rpc('app_harmony_record_event', {
      p_event_key: body.event || 'client_event',
      p_area: body.area || 'netlify',
      p_payload: body.payload || {}
    }, false);
    return json(200, data);
  } catch (error) {
    return json(200, { ok: false, message: error.message });
  }
};
