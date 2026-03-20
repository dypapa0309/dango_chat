import { createClient } from '@supabase/supabase-js';
import { mustEnv, env } from './env.js';

export function adminClient() {
  return createClient(
    mustEnv('SUPABASE_URL'),
    mustEnv('SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export function publicConfig() {
  return {
    supabaseUrl: mustEnv('SUPABASE_URL'),
    supabaseAnonKey: env('SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY'),
    siteUrl: env('SITE_URL')
  };
}
