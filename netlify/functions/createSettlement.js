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
    const { data: job, error } = await supabase.from('jobs').select('*').eq('id', jobId).single();
    if (error) throw error;
    if (!job.assigned_driver_id) return fail('배정된 기사가 없습니다.');

    const { data, error: createError } = await supabase.from('settlements').insert({
      job_id: job.id,
      driver_id: job.assigned_driver_id,
      amount: job.driver_amount || 0,
      status: 'pending',
      memo: '자동 정산 생성'
    }).select('*').single();
    if (createError) throw createError;
    return ok({ settlement: data });
  } catch (error) {
    return fail('정산 생성 실패', error.message, 500);
  }
}
