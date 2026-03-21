import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';
import { requireAdmin } from '../../shared/admin-auth.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  const denied = requireAdmin(event);
  if (denied) return denied;

  try {
    const status = event?.queryStringParameters?.status;
    const supabase = adminClient();
    let query = supabase.from('jobs').select('*').is('archived_at', null).order('created_at', { ascending: false });
    if (status && status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return ok({ jobs: data || [] });
  } catch (error) {
    return fail('주문 목록 조회 실패', error.message, 500);
  }
}
