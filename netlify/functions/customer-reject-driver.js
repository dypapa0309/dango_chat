import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

const MAX_REJECTIONS = 2;

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const { token, reason } = parseBody(event);
    if (!token) return fail('token이 필요합니다.');

    const supabase = adminClient();

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, dispatch_status, customer_rejection_count, customer_reject_token')
      .eq('customer_reject_token', token)
      .single();
    if (jobError || !job) return fail('유효하지 않은 거절 토큰입니다.');

    // 거절 가능 상태 확인
    if (!['confirmed', 'assigned'].includes(job.status)) {
      return fail('현재 상태에서는 거절할 수 없어요. 작업이 이미 시작됐거나 완료됐어요.');
    }
    if (job.dispatch_status !== 'accepted') {
      return fail('아직 기사가 수락하지 않아서 거절할 수 없어요.');
    }

    const rejectionCount = Number(job.customer_rejection_count || 0);
    if (rejectionCount >= MAX_REJECTIONS) {
      return fail(`최대 ${MAX_REJECTIONS}회 거절까지만 가능해요. 더 이상 거절할 수 없어요.`);
    }

    // 현재 활성 assignment 취소
    const { data: activeAssignment } = await supabase
      .from('assignments')
      .select('id, driver_id')
      .eq('job_id', job.id)
      .in('status', ['requested', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeAssignment) {
      await supabase.from('assignments').update({ status: 'canceled', updated_by: 'customer_reject' }).eq('id', activeAssignment.id);
      await supabase.from('dispatch_logs').insert({
        job_id: job.id,
        assignment_id: activeAssignment.id,
        driver_id: activeAssignment.driver_id,
        event_type: 'customer_rejected',
        actor_type: 'customer',
        actor_name: 'customer',
        prev_status: job.dispatch_status,
        next_status: 'reassign_needed',
        message: `고객 거절 (${rejectionCount + 1}/${MAX_REJECTIONS}회)${reason ? ': ' + reason : ''}`
      });
    }

    // 거절 횟수 증가, 재배차 요청
    await supabase.from('jobs').update({
      dispatch_status: 'reassign_needed',
      customer_rejection_count: rejectionCount + 1,
      updated_by: 'customer_reject'
    }).eq('id', job.id);

    return ok({
      rejected: true,
      rejectionCount: rejectionCount + 1,
      maxRejections: MAX_REJECTIONS,
      canRejectAgain: rejectionCount + 1 < MAX_REJECTIONS
    });
  } catch (error) {
    return fail('거절 처리에 실패했어요.', error.message, 500);
  }
}
