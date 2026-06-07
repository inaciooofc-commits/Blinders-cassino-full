import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://lbmmqfgcyimijaqnvvpx.supabase.co';
const fallbackAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxibW1xZmdjeWltaWphcW52dnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTY1NjQsImV4cCI6MjA5NTk5MjU2NH0._pQTy5TJ-MZ9Ep2dpD4XbLQGqLRkhzsjQCqDseJ9Cto';

const url = import.meta.env.VITE_SUPABASE_URL || fallbackUrl;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackAnonKey;

export const SupabaseConfig = { url, anonKey, enabled: Boolean(url && anonKey) };

export const supabase = SupabaseConfig.enabled
  ? createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { 'x-blinders-client': 'v14.6' } }
    })
  : null;
