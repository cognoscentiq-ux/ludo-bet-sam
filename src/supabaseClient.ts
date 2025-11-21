import { createClient } from '@supabase/supabase-js';

// Prefer environment variables (configured in Vercel) and fall back to hard-coded project ref.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://mzdclssjndpdhckmknve.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl) {
  console.warn('[Supabase] Missing URL env (VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL)');
}
if (!supabaseAnonKey) {
  console.warn('[Supabase] Missing anon key env (VITE_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Ensure production persistence & auto refresh on Vercel
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
