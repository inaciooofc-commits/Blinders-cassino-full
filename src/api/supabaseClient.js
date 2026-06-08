import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const SupabaseConfig = { url, anonKey, enabled: Boolean(url && anonKey) };
export const supabase = SupabaseConfig.enabled ? createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { headers: { 'x-blinders-release': 'launch' } } }) : null;
