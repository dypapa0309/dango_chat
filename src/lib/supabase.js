import { createClient } from '@supabase/supabase-js'

let _client = null

export function initSupabase(url, anonKey) {
  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

export function getSupabase() {
  if (!_client) throw new Error('Supabase not initialized')
  return _client
}
