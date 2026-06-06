import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://lbmmqfgcyimijaqnvvpx.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxibW1xZmdjeWltaWphcW52dnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTY1NjQsImV4cCI6MjA5NTk5MjU2NH0._pQTy5TJ-MZ9Ep2dpD4XbLQGqLRkhzsjQCqDseJ9Cto';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  global: {
    headers: {
      'x-blinders-client': 'netlify-v5-admin-fix'
    }
  }
});
