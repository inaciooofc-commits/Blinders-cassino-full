const { rpc, json, options } = require('./_supabase.cjs');

exports.handler = async function handler(event) {
  const opt = options(event);
  if (opt) return opt;

  try {
    const data = await rpc('app_health_public', {}, 'anon').catch(() => null);
    return json(200, {
      ok: true,
      app: 'Blinders Cassino',
      mode: 'V5 Admin Supabase Fix',
      supabaseConfigured: true,
      envSupabaseUrl: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      envAnonKey: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
      serviceConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      fallbackPublicConfig: true,
      database: data,
      time: new Date().toISOString()
    });
  } catch (error) {
    return json(200, {
      ok: false,
      message: error.message,
      fallbackPublicConfig: true,
      time: new Date().toISOString()
    });
  }
};
