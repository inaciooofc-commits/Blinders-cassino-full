const FALLBACK_SUPABASE_URL = 'https://lbmmqfgcyimijaqnvvpx.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxibW1xZmdjeWltaWphcW52dnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTY1NjQsImV4cCI6MjA5NTk5MjU2NH0._pQTy5TJ-MZ9Ep2dpD4XbLQGqLRkhzsjQCqDseJ9Cto';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  FALLBACK_SUPABASE_URL;

const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  FALLBACK_ANON_KEY;

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function keyFor(mode = 'anon') {
  // Para não criar brecha: service_role só é usada se estiver configurada
  // e se a função pedir explicitamente. O padrão é anon + RPC security definer.
  if (mode === 'service' && SERVICE_KEY) return SERVICE_KEY;
  return ANON_KEY;
}

async function rpc(name, params = {}, mode = 'anon') {
  if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error('Supabase sem URL/chave pública. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }

  const key = keyFor(mode);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params || {})
  });

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!response.ok) {
    const err = new Error(data?.message || data?.hint || text || 'Erro Supabase');
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function assertAdmin(token) {
  if (!token) {
    const err = new Error('Token ausente. Faça login novamente.');
    err.status = 401;
    throw err;
  }

  const member = await rpc('v25_current', { p_token: token }, 'anon');
  if (!['admin', 'owner'].includes(member?.role)) {
    const err = new Error('Acesso reservado para admin/dono.');
    err.status = 403;
    throw err;
  }
  return member;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST,GET,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

function options(event) {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }
  return null;
}

module.exports = { rpc, json, assertAdmin, options };
