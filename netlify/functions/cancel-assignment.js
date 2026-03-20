import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const { jobId } = parseBody(event);
    if (!jobId) return fail('jobId가 필요합니다.');
    const supabase = adminClient();
    await supabase.from('assignments').update({ status: 'canceled', canceled_at: new Date().toISOString(), canceled_reason: '관리자 취소', updated_by: 'admin' }).eq('job_id', jobId).eq('status', 'requested');
    await supabase.from('jobs').update({ dispatch_status: 'idle', updated_by: 'admin' }).eq('id', jobId);
    await supabase.from('dispatch_logs').insert({ job_id: jobId, event_type: 'assignment_canceled', actor_type: 'admin', actor_name: 'admin', prev_status: 'requesting', next_status: 'idle', message: '관리자가 배차 요청을 취소했습니다.', meta: {} });
    return ok({ message: '배차 취소 완료' });
  } catch (error) {
    return fail('배차 취소 실패', error.message, 500);
  }
}
