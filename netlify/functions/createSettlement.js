import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { buildApprovedSettlementFields } from '../../shared/settlements.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const { jobId } = parseBody(event);
    if (!jobId) return fail('jobId가 필요합니다.');
    const supabase = adminClient();
    const { data: job, error } = await supabase.from('jobs').select('*').eq('id', jobId).single();
    if (error) throw error;
    if (!job.assigned_driver_id) return fail('배정된 기사가 없습니다.');

    const { data: existing } = await supabase
      .from('settlements')
      .select('*')
      .eq('job_id', job.id)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data, error: updateError } = await supabase
        .from('settlements')
        .update({
          driver_id: job.assigned_driver_id,
          amount: job.driver_amount || existing.amount || 0,
          ...buildApprovedSettlementFields(new Date()),
          memo: '완료 처리로 정산 승인'
        })
        .eq('id', existing.id)
        .select('*')
        .single();
      if (updateError) throw updateError;
      return ok({ settlement: data, reused: true });
    }

    const { data, error: createError } = await supabase.from('settlements').insert({
      job_id: job.id,
      driver_id: job.assigned_driver_id,
      amount: job.driver_amount || 0,
      ...buildApprovedSettlementFields(new Date()),
      memo: '자동 정산 생성'
    }).select('*').single();
    if (createError) throw createError;
    return ok({ settlement: data });
  } catch (error) {
    return fail('정산 생성 실패', error.message, 500);
  }
}
