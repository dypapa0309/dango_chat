import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { requireAdmin } from '../../shared/admin-auth.js';

const ALLOWED = new Set(['draft','deposit_pending','confirmed','assigned','in_progress','completed','canceled']);
const TERMINAL = new Set(['completed','canceled']);

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');
  const denied = requireAdmin(event);
  if (denied) return denied;

  try {
    const { jobId, status, dispatchStatus, note } = parseBody(event);
    if (!jobId || !status) return fail('jobId, status가 필요합니다.');
    if (!ALLOWED.has(status)) return fail('허용되지 않은 상태값입니다.');

    const supabase = adminClient();
    const { data: before, error: beforeError } = await supabase.from('jobs').select('*').eq('id', jobId).single();
    if (beforeError) throw beforeError;

    if (TERMINAL.has(before.status) && before.status !== status) {
      return fail(`이미 종료된 주문입니다 (현재 상태: ${before.status}). 상태를 변경하려면 직접 DB를 수정하세요.`);
    }

    const patch = { status, updated_by: 'admin' };
    if (dispatchStatus) patch.dispatch_status = dispatchStatus;
    if (status === 'canceled') {
      patch.canceled_at = new Date().toISOString();
      patch.canceled_reason = note || '관리자 취소';
    }

    const { data, error } = await supabase.from('jobs').update(patch).eq('id', jobId).select('*').single();
    if (error) throw error;

    await supabase.from('dispatch_logs').insert({
      job_id: jobId,
      event_type: 'job_status_updated',
      actor_type: 'admin',
      actor_name: 'admin',
      prev_status: before.status,
      next_status: status,
      message: note || `${status} 상태로 변경`,
      meta: { dispatch_status: dispatchStatus || before.dispatch_status }
    });

    return ok({ job: data });
  } catch (error) {
    return fail('주문 상태 변경 실패', error.message, 500);
  }
}
