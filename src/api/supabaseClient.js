import { createClient } from '@supabase/supabase-js';

const fallbackUrl = '';
const fallbackAnonKey = '';

const url = import.meta.env.VITE_SUPABASE_URL || fallbackUrl;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackAnonKey;

export const SupabaseConfig = {
  url,
  anonKey,
  enabled: Boolean(url && anonKey)
};

export const supabase = SupabaseConfig.enabled
  ? createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: { 'x-blinders-client': 'final-1.0' }
      }
    })
  : null;
