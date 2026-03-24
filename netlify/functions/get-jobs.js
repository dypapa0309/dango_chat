import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';
import { requireAdmin } from '../../shared/admin-auth.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  const denied = requireAdmin(event);
  if (denied) return denied;

  try {
    const params = event?.queryStringParameters || {};
    const status = params.status;
    const page = Math.max(0, Number(params.page || 0));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 30)));
    const from = page * limit;
    const to = from + limit - 1;

    const supabase = adminClient();
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (status && status !== 'all') query = query.eq('status', status);
    const { data, error, count } = await query;
    if (error) throw error;
    return ok({ jobs: data || [], total: count || 0, page, limit });
  } catch (error) {
    return fail('주문 목록 조회 실패', error.message, 500);
  }
}
