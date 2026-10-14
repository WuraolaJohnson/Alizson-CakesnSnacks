import { createClient } from '@supabase/supabase-js';

// VITE_* from .env locally; NEXT_PUBLIC_* from Vercel's Supabase integration.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing env vars VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Running in offline/localStorage mode.'
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // PKCE returns ?code=… in the query string. The default (implicit)
        // flow puts tokens in the #hash, which clashes with #admin / #rider.
        flowType: 'pkce'
      },
      realtime: {
        params: { eventsPerSecond: 10 }
      }
    })
  : null;

export const isSupabaseReady = () => !!supabase;
