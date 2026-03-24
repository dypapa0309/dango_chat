import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  try {
    const now = new Date().toISOString();
    const supabase = adminClient();
    const { data: rows, error } = await supabase.from('assignments').select('*').eq('status', 'requested').lt('expires_at', now);
    if (error) throw error;
    const jobIds = [...new Set((rows || []).map((v) => v.job_id))];
    if (rows?.length) {
      await supabase.from('assignments').update({ status: 'expired', updated_by: 'system' }).in('id', rows.map((v) => v.id));
      await supabase.from('jobs').update({ dispatch_status: 'reassign_needed', updated_by: 'system' }).in('id', jobIds);
      const logEntries = rows.map((v) => ({
        job_id: v.job_id,
        driver_id: v.driver_id || null,
        event_type: 'assignment_expired',
        actor_type: 'system',
        actor_name: 'expire-assignment',
        prev_status: 'requesting',
        next_status: 'reassign_needed',
        message: '배차 요청이 응답 시간 초과로 만료됐습니다.',
        meta: { assignment_id: v.id, expired_at: now }
      }));
      await supabase.from('dispatch_logs').insert(logEntries);
    }
    return ok({ expiredCount: rows?.length || 0, jobIds });
  } catch (error) {
    return fail('만료 처리 실패', error.message, 500);
  }
}
