import crypto from 'crypto';
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
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', jobId)
      .single();
    if (jobError) throw jobError;
    if (!job) return fail('주문을 찾을 수 없어요.');
    if (job.status === 'canceled') return fail('취소된 주문은 토큰을 재발급할 수 없어요.');

    const newCompleteToken = crypto.randomUUID();
    const newCancelToken = crypto.randomUUID();

    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        customer_complete_token: newCompleteToken,
        customer_cancel_token: newCancelToken,
        updated_by: 'admin-token-regen'
      })
      .eq('id', jobId);
    if (updateError) throw updateError;

    await supabase.from('dispatch_logs').insert({
      job_id: jobId,
      event_type: 'tokens_regenerated',
      actor_type: 'admin',
      actor_name: 'admin',
      message: '관리자가 고객 토큰을 재발급했습니다.',
      meta: {}
    });

    return ok({
      customerCompleteToken: newCompleteToken,
      customerCancelToken: newCancelToken
    });
  } catch (error) {
    return fail('토큰 재발급 실패', error.message, 500);
  }
}
