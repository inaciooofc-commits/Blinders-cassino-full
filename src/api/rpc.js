import { supabase } from '../config/supabase.js';

export async function rpc(name, params = {}) {
  const { data, error } = await supabase.rpc(name, params);

  if (error) {
    throw new Error(error.message || error.details || error.hint || `Erro Supabase em ${name}`);
  }

  return data;
}

// Mantido só por compatibilidade. Nesta edição Cloudflare Free,
// o caminho principal é RPC direta no Supabase.
export async function functionPost(name, payload = {}) {
  throw new Error(`Função ${name} não usada nesta edição. Use RPC Supabase direta.`);
}
