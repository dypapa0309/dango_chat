import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { requireAdmin } from '../../shared/admin-auth.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');
  const denied = requireAdmin(event);
  if (denied) return denied;

  try {
    const { jobId } = parseBody(event);
    if (!jobId) return fail('jobId가 필요합니다.');
    const supabase = adminClient();
    const { data: pendingAssignments, error: pendingError } = await supabase
      .from('assignments')
      .select('id, status')
      .eq('job_id', jobId)
      .eq('status', 'requested');
    if (pendingError) throw pendingError;

    const canceledCount = pendingAssignments?.length || 0;
    if (!canceledCount) {
      const { data: currentJob } = await supabase
        .from('jobs')
        .select('dispatch_status')
        .eq('id', jobId)
        .maybeSingle();
      return ok({
        message: '취소할 배차 요청이 없어요.',
        canceledCount: 0,
        dispatchStatus: currentJob?.dispatch_status || null
      });
    }

    const { error: updateAssignmentError } = await supabase
      .from('assignments')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        canceled_reason: '관리자 취소',
        updated_by: 'admin'
      })
      .eq('job_id', jobId)
      .eq('status', 'requested');
    if (updateAssignmentError) throw updateAssignmentError;

    const { error: updateJobError } = await supabase
      .from('jobs')
      .update({ dispatch_status: 'idle', updated_by: 'admin' })
      .eq('id', jobId);
    if (updateJobError) throw updateJobError;

    const { error: logError } = await supabase.from('dispatch_logs').insert({
      job_id: jobId,
      event_type: 'assignment_canceled',
      actor_type: 'admin',
      actor_name: 'admin',
      prev_status: 'requesting',
      next_status: 'idle',
      message: '관리자가 배차 요청을 취소했습니다.',
      meta: { canceledCount }
    });
    if (logError) throw logError;

    return ok({ message: '배차 요청을 취소했어요.', canceledCount, dispatchStatus: 'idle' });
  } catch (error) {
    return fail('배차 취소 실패', error.message, 500);
  }
}
