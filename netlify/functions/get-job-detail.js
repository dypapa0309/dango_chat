import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';
import { requireAdmin } from '../../shared/admin-auth.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  const denied = requireAdmin(event);
  if (denied) return denied;

  try {
    const jobId = event?.queryStringParameters?.jobId;
    if (!jobId) return fail('jobId가 필요합니다.');
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('*, assignments(*, drivers(*)), dispatch_logs(*), payments(*), settlements(*)')
      .eq('id', jobId)
      .single();
    if (error) throw error;
    return ok({ job: data });
  } catch (error) {
    return fail('주문 상세 조회 실패', error.message, 500);
  }
}
