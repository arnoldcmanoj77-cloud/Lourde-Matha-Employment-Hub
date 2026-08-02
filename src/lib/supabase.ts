import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a fallback dummy client if env vars not set yet
// so the app can still render while Supabase is being configured
const isConfigured =
  supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 0;

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key');

export const isSupabaseConfigured = isConfigured;
